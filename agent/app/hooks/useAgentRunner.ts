import { useCallback, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import type { ProgressUpdate } from "@agent-monorepo/types";

type UpdateItem = ProgressUpdate & { key: string };

export function useAgentRunner() {
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const latestInputTokens = useMemo(() => {
    // Sum all numeric inputTokens across updates to report total input tokens used
    let total = 0;
    for (let i = 0; i < updates.length; i++) {
      const v = updates[i].inputTokens;
      if (typeof v === "number" && Number.isFinite(v)) total += v;
    }
    return total;
  }, [updates]);

  const latestOutputTokens = useMemo(() => {
    // Sum all numeric outputTokens across updates to report total output tokens used
    let total = 0;
    for (let i = 0; i < updates.length; i++) {
      const v = updates[i].outputTokens;
      if (typeof v === "number" && Number.isFinite(v)) total += v;
    }
    return total;
  }, [updates]);

  const appendUpdate = useCallback((u: ProgressUpdate) => {
    setUpdates((prev) => [
      ...prev,
      { ...u, key: `${u.jobId}-${u.timestamp}-${prev.length}` },
    ]);
  }, []);

  const makeId = useCallback(() => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
    const len = 12;
    let out = "";
    for (let i = 0; i < len; i++) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
  }, []);

  const run = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) return;
      setIsRunning(true);
      setError(null);
      setUpdates([]);

      const id = makeId();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const supportsEventSource =
          typeof window !== "undefined" && "EventSource" in window;
        if (supportsEventSource) {
          const qs = new URLSearchParams({ id, prompt }).toString();
          const es = new EventSource(`http://localhost:3000/v1/run?${qs}`);
          const close = () => es.close();
          controller.signal.addEventListener("abort", close);

          es.onmessage = (evt) => {
            try {
              const update = JSON.parse(evt.data) as ProgressUpdate;
              if (update && (update as any).timestamp) {
                (update as any).timestamp = new Date(
                  (update as any).timestamp
                ) as any;
              }
              appendUpdate(update);
              if (update.isFinal) {
                es.close();
                setIsRunning(false);
              }
            } catch {}
          };
          es.onerror = () => {
            es.close();
          };

          return;
        }

        const isMobile = Platform.OS !== "web";
        if (isMobile) {
          await new Promise<void>((resolve, reject) => {
            const XHR =
              (global as any).XMLHttpRequest || (XMLHttpRequest as any);
            const xhr = new XHR();
            let lastIndex = 0;
            let buffer = "";

            const processBuffer = () => {
              buffer = buffer.replace(/\r\n/g, "\n");
              let idx;
              while ((idx = buffer.indexOf("\n\n")) !== -1) {
                const rawEvent = buffer.slice(0, idx).trim();
                buffer = buffer.slice(idx + 2);

                const dataLine = rawEvent
                  .split("\n")
                  .find((l: string) => l.startsWith("data:"));
                if (!dataLine) continue;
                const payload = dataLine.replace(/^data:\s?/, "");
                try {
                  const update = JSON.parse(payload) as ProgressUpdate;
                  if (update && (update as any).timestamp) {
                    (update as any).timestamp = new Date(
                      (update as any).timestamp
                    ) as any;
                  }
                  appendUpdate(update);
                  if (update.isFinal) {
                    try {
                      xhr.abort();
                    } catch {}
                    abortRef.current = null;
                    setIsRunning(false);
                    resolve();
                    return;
                  }
                } catch (e) {
                  // ignore
                }
              }
            };

            xhr.open("POST", "http://localhost:3000/v1/run");
            xhr.setRequestHeader("Content-Type", "application/json");

            xhr.onreadystatechange = () => {
              if (xhr.readyState === 4) {
                const remaining = xhr.responseText?.slice(lastIndex) || "";
                if (remaining) {
                  buffer += remaining;
                  processBuffer();
                }
                resolve();
              }
            };

            xhr.onprogress = () => {
              try {
                const text = xhr.responseText || "";
                if (text.length > lastIndex) {
                  const chunk = text.slice(lastIndex);
                  lastIndex = text.length;
                  buffer += chunk;
                  processBuffer();
                }
              } catch (e) {
                // ignore
              }
            };

            xhr.onerror = () => {
              reject(new Error("Network error during XHR streaming"));
            };

            const onAbort = () => {
              try {
                xhr.abort();
              } catch {}
              abortRef.current = null;
              resolve();
            };
            controller.signal.addEventListener("abort", onAbort);

            xhr.send(JSON.stringify({ id, prompt }));
          });
          return;
        }

        const res = await fetch("http://localhost:3000/v1/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, prompt }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        if (res.body) {
          const decoder = new TextDecoder("utf-8");
          let buffer = "";

          const processBuffer = () => {
            buffer = buffer.replace(/\r\n/g, "\n");
            let idx;
            while ((idx = buffer.indexOf("\n\n")) !== -1) {
              const rawEvent = buffer.slice(0, idx).trim();
              buffer = buffer.slice(idx + 2);

              const dataLine = rawEvent
                .split("\n")
                .find((l) => l.startsWith("data:"));
              if (!dataLine) continue;
              const payload = dataLine.replace(/^data:\s?/, "");
              try {
                const update = JSON.parse(payload) as ProgressUpdate;
                if (update && (update as any).timestamp) {
                  (update as any).timestamp = new Date(
                    (update as any).timestamp
                  ) as any;
                }
                appendUpdate(update);
                if (update.isFinal) {
                  abortRef.current?.abort();
                  abortRef.current = null;
                  setIsRunning(false);
                }
              } catch (e) {
                // ignore
              }
            }
          };

          if (typeof (res.body as any).getReader === "function") {
            const reader = (res.body as any).getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              processBuffer();
            }
          } else if (
            typeof (res.body as any)[Symbol.asyncIterator] === "function"
          ) {
            for await (const chunk of res.body as any) {
              buffer += decoder.decode(chunk, { stream: true });
              processBuffer();
            }
          }
        } else {
          const text = await res.text();
          const events = text.split("\n\n");
          for (const e of events) {
            const line = e.split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;
            const payload = line.replace(/^data:\s?/, "");
            try {
              const update = JSON.parse(payload) as ProgressUpdate;
              if (update && (update as any).timestamp) {
                (update as any).timestamp = new Date(
                  (update as any).timestamp
                ) as any;
              }
              appendUpdate(update);
            } catch {}
          }
          setIsRunning(false);
        }
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error(e);
        setError(
          "Failed to connect or stream updates. Ensure the server is running on http://localhost:3000."
        );
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [appendUpdate, makeId]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
  }, []);

  return {
    updates,
    isRunning,
    error,
    latestInputTokens,
    latestOutputTokens,
    run,
    cancel,
  } as const;
}
