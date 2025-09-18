import { useState, useCallback, useRef, useEffect } from "react";
import { ProgressUpdate } from "@agent-monorepo/types";
import { SERVER_URL, API_ENDPOINTS } from "../constants";

export interface UseJobStateReturn {
  prompt: string;
  setPrompt: (prompt: string) => void;
  updates: ProgressUpdate[];
  isRunning: boolean;
  error: string | null;
  runJob: () => Promise<void>;
  stopJob: () => void;
  clearError: () => void;
  getTotalTokens: () => { input: number; output: number } | null;
}

function generateRandomString(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function useJobState(): UseJobStateReturn {
  const [prompt, setPrompt] = useState("");
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const stopJob = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRunning(false);
    setError("Job stopped by user");
  }, []);

  const runJob = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    const jobId = generateRandomString();
    setIsRunning(true);
    setError(null);
    setUpdates([]);

    try {
      // Create AbortController for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch(`${SERVER_URL}${API_ENDPOINTS.RUN_JOB}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: jobId, prompt: prompt.trim() }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Read the SSE stream from the POST response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body reader available");
      }

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("SSE stream ended");
            abortControllerRef.current = null;
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log("Received SSE data:", data);

                const update: ProgressUpdate = {
                  ...data,
                  timestamp: new Date(data.timestamp),
                };

                setUpdates((prev) => [...prev, update]);

                if (update.isFinal) {
                  setIsRunning(false);
                  abortControllerRef.current = null;
                  return;
                }
              } catch (parseError) {
                console.error(
                  "Error parsing SSE data:",
                  parseError,
                  "Raw data:",
                  line
                );
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      console.error("Job error:", err);

      // Don't show error if the request was aborted (user stopped the job)
      if (err instanceof Error && err.name === "AbortError") {
        setIsRunning(false);
        return;
      }

      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setIsRunning(false);
    } finally {
      abortControllerRef.current = null;
    }
  }, [prompt]);

  const getTotalTokens = useCallback(() => {
    if (updates.length === 0) return null;
    const lastUpdate = updates[updates.length - 1];
    return {
      input: lastUpdate.inputTokens || 0,
      output: lastUpdate.outputTokens || 0,
    };
  }, [updates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    prompt,
    setPrompt,
    updates,
    isRunning,
    error,
    runJob,
    stopJob,
    clearError,
    getTotalTokens,
  };
}
