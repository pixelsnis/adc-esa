import { type ProgressUpdate } from "@agent-monorepo/types";
import type { Request, Response } from "express";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Experimental_Agent as Agent, hasToolCall } from "ai";
import { braveSearchTool, firecrawlScrapeTool, sendResultTool } from "./tools";
import z from "zod";

const runRequestSchema = z.object({
  id: z.string(),
  prompt: z.string(),
});

async function runJob(req: Request, res: Response) {
  const body = await req.body;

  console.info("Received job run request", body);

  res.header("Content-Type", "text/event-stream");
  res.header("Cache-Control", "no-cache");
  res.header("Connection", "keep-alive");
  res.flushHeaders(); // Flush the headers to establish SSE with client

  const { id, prompt } = runRequestSchema.parse(await req.body);
  try {
    const gemini = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const agent = new Agent({
      model: gemini("gemini-2.5-flash"),
      tools: {
        web_search: braveSearchTool,
        web_scrape: firecrawlScrapeTool,
        send_result: sendResultTool,
      },
      system: `
      You are an AI assistant that performs long-running tasks by breaking them down into smaller tasks and using tools to complete them.
      You have access to several tools, including web search and web scraping.
      You may call the "send_result" tool to declare that the job is finished and provide the final result.
      `,
      stopWhen: [hasToolCall("send_result")],
      onStepFinish: async (step) => {
        let updates: string[] = [];

        console.info(`Finished step. Reason: ${step.finishReason}`);

        if (step.reasoningText) {
          console.info("Step contained reasoning text.");
          updates.push(step.reasoningText);
        }

        if (step.toolCalls.length > 0) {
          for (const call of step.toolCalls) {
            console.info(`Called tool: ${call.toolName}`);
            updates.push(`Called tool "${call.toolName}"`);
          }
        }

        if (step.toolResults.length > 0) {
          for (const result of step.toolResults) {
            console.info(`Tool ${result.toolName} returned a response.`);
            updates.push(`${result.toolName} returned a response`);
          }
        }

        const update: ProgressUpdate = {
          jobId: id,
          messages: updates,
          timestamp: new Date(),
          inputTokens: step.usage.inputTokens,
          outputTokens: step.usage.outputTokens,
        };

        await streamUpdate(update, res);
      },
    });

    const result = await agent.generate({
      messages: [{ role: "user", content: prompt }],
    });

    console.info("Agent generation complete.");

    let jobResult = "";

    if (result.text) {
      jobResult = result.text;
    } else if (
      result.toolResults.filter((t) => t.toolName === "send_result").length > 0
    ) {
      jobResult = (
        result.toolResults.find((t) => t.toolName === "send_result")
          ?.output as { result: string }
      )?.result;
    }

    const finalUpdate: ProgressUpdate = {
      jobId: id,
      messages: [jobResult || "Job completed."],
      timestamp: new Date(),
      isFinal: true,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
    };

    await streamUpdate(finalUpdate, res);

    res.end(); // Close the SSE stream
  } catch (err) {
    console.error("Error executing job:", err);
    // Stream error as an update for consistency with SSE
    const errorUpdate: ProgressUpdate = {
      jobId: id,
      messages: ["An error occurred while processing the job."],
      timestamp: new Date(),
      isFinal: true,
    };
    await streamUpdate(errorUpdate, res);
    res.end();
  }
}

async function streamUpdate(update: ProgressUpdate, res: Response) {
  console.info(`Streaming update for job ${update.jobId}:`, update.messages);
  res.write(`data: ${JSON.stringify(update)}\n\n`);
}

export { runJob };
