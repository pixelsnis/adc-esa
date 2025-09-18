import Firecrawl, { type SearchData } from "@mendable/firecrawl-js";
import { tool } from "ai";
import fetch from "node-fetch";
import { z } from "zod";

const BRAVE_SEARCH_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
const BRAVE_BASE_URL = "https://api.search.brave.com/res/v1/web/search";

// explicit schemas
const inputSchema = z.object({
  query: z.string(),
});

const SearchResultSchema = z.object({
  title: z.string(),
  url: z.string().nonempty(),
  description: z.string().optional(),
});

const outputSchema = z.object({
  results: z.array(SearchResultSchema),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const braveSearchTool = tool({
  name: "web_search",
  description: "Search the web for relevant information and links.",
  inputSchema,
  outputSchema,
  execute: async ({ query }: Input): Promise<Output> => {
    console.info(`Executing web search for query: ${query}`);

    try {
      if (!BRAVE_SEARCH_API_KEY) {
        console.warn(
          "Missing BRAVE_SEARCH_API_KEY env var — returning empty results."
        );
        return { results: [] };
      }

      const params = new URLSearchParams({
        q: query,
        count: "10", // you can expose this in the input schema if you want
      });

      const url = `${BRAVE_BASE_URL}?${params.toString()}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": BRAVE_SEARCH_API_KEY,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Brave Search API error:", res.status, text);
        return { results: [] };
      }

      const json = await res.json();

      // Brave's web results are typically at json.web.results — be defensive about shapes.
      const rawResults = Array.isArray(json?.web?.results)
        ? json.web.results
        : Array.isArray(json?.results)
        ? json.results
        : [];

      // Map to the shape declared in outputSchema
      const mapped = rawResults
        .map((r: any) => {
          const title = r.title ?? r.heading ?? r.name ?? "";
          const url = r.url ?? r.link ?? r.canonical_url ?? "";
          const description =
            r.description ?? r.snippet ?? r.excerpt ?? r.summary ?? undefined;

          return {
            title: String(title).trim(),
            url: String(url).trim(),
            description: description ? String(description).trim() : undefined,
          };
        })
        .filter((item: any) => item.title && item.url) // drop malformed entries
        .slice(0, 10); // cap results

      // validate/normalize with Zod so the returned object matches outputSchema exactly
      return outputSchema.parse({ results: mapped });
    } catch (err) {
      console.error("Error executing web search tool:", err);
      return { results: [] };
    }
  },
});

const firecrawlSearchTool = tool({
  name: "web_search",
  description: "Search the web for relevant information and links.",
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    results: z.custom<SearchData>(),
  }),
  execute: async ({ query }: { query: string }) => {
    try {
      const firecrawl = new Firecrawl({
        apiKey: process.env.FIRECRAWL_API_KEY!,
      });
      const results = await firecrawl.search(query, { limit: 5 });
      return { results };
    } catch (err) {
      console.error("Error executing web search tool:", err);
      throw err;
    }
  },
});

const firecrawlScrapeTool = tool({
  name: "web_scrape",
  description: "Scrape the main content from a webpage URL.",
  inputSchema: z.object({
    url: z.string(),
  }),
  outputSchema: z.object({
    content: z.string(),
  }),
  execute: async ({ url }: { url: string }) => {
    console.info(`Executing web scrape for URL: ${url}`);

    const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });

    try {
      const result = await firecrawl.scrape(url, { formats: ["markdown"] });
      const content = result.markdown ?? "";

      return { content };
    } catch (err) {
      console.error("Error executing web scrape tool:", err);
      return { content: "" };
    }
  },
});

const sendResultTool = tool({
  name: "send_result",
  description: "Declare that the job is finished and provide the final result.",
  inputSchema: z.object({ result: z.string() }),
  execute: async ({ result: _ }: { result: string }) => {
    console.info("Job completed, final result sent.");
    return;
    // This tool doesn't need to do anything; the agent framework will handle stopping.
  },
});

export {
  braveSearchTool,
  firecrawlSearchTool,
  firecrawlScrapeTool,
  sendResultTool,
};
