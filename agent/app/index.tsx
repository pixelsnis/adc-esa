import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Constants from "expo-constants";
import type { ProgressUpdate } from "@agent-monorepo/types";

type UpdateItem = ProgressUpdate & { key: string };

export default function Index() {
  const [prompt, setPrompt] = useState("");
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestInputTokens = useMemo(() => {
    for (let i = updates.length - 1; i >= 0; i--) {
      if (typeof updates[i].inputTokens === "number")
        return updates[i].inputTokens!;
    }
    return 0;
  }, [updates]);
  const latestOutputTokens = useMemo(() => {
    for (let i = updates.length - 1; i >= 0; i--) {
      if (typeof updates[i].outputTokens === "number")
        return updates[i].outputTokens!;
    }
    return 0;
  }, [updates]);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  const appendUpdate = useCallback((u: ProgressUpdate) => {
    setUpdates((prev) => [
      ...prev,
      { ...u, key: `${u.jobId}-${u.timestamp}-${prev.length}` },
    ]);
    // Auto-scroll to bottom
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const makeId = useCallback(() => {
    // Random string generator (not UUID): 12 chars from a-z0-9
    const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
    const len = 12;
    let out = "";
    for (let i = 0; i < len; i++) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
  }, []);

  const runJob = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsRunning(true);
    setError(null);
    setUpdates([]);

    const id = makeId();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Prefer EventSource when available (web) for true incremental SSE
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
            console.info("EventSource received update:", update);
            appendUpdate(update);
            if (update.isFinal) {
              es.close();
              setIsRunning(false);
            }
          } catch {}
        };
        es.onerror = () => {
          // Leave EventSource mode and fall back
          es.close();
          // Intentionally not throwing; we'll fall back to fetch stream
        };

        // Early return and continue running until final or cancel
        return;
      }

      // On mobile (React Native), fetch streaming often isn't available.
      // Use an XHR streaming approach there which exposes incremental
      // responseText via onprogress. Otherwise use fetch streaming.
      const isMobile = Platform.OS !== "web";
      if (isMobile) {
        await new Promise<void>((resolve, reject) => {
          // Use global XMLHttpRequest (available in RN/Expo)
          const XHR = (global as any).XMLHttpRequest || (XMLHttpRequest as any);
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
                console.info("XHR stream received update:", update);
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
                // ignore JSON parse errors
              }
            }
          };

          xhr.open("POST", "http://localhost:3000/v1/run");
          xhr.setRequestHeader("Content-Type", "application/json");

          xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
              // Completed
              // Process any remaining buffered data
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
              // ignore incremental read errors
            }
          };

          xhr.onerror = () => {
            reject(new Error("Network error during XHR streaming"));
          };

          // Wire abort controller
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
        // After XHR finishes, exit runJob (state already updated when final arrives)
        return;
      }

      // Fallback to POST streaming via fetch
      const res = await fetch("http://localhost:3000/v1/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, prompt }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      if (res.body) {
        // Handle streaming bodies that expose getReader() (ReadableStream)
        // or async-iterable stream (Node/React Native environments). If
        // neither is available, fall back to reading the full text below.
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        const processBuffer = () => {
          // Normalize CRLF to LF for consistent splitting
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
              console.info("Stream received update:", update);
              appendUpdate(update);
              if (update.isFinal) {
                abortRef.current?.abort();
                abortRef.current = null;
                setIsRunning(false);
              }
            } catch (e) {
              // ignore JSON parse errors for non-data lines
            }
          }
        };

        // ReadableStream in browsers (getReader)
        if (typeof (res.body as any).getReader === "function") {
          const reader = (res.body as any).getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            processBuffer();
          }
          // Async-iterable stream (Node.js / some RN fetch polyfills)
        } else if (
          typeof (res.body as any)[Symbol.asyncIterator] === "function"
        ) {
          for await (const chunk of res.body as any) {
            buffer += decoder.decode(chunk, { stream: true });
            processBuffer();
          }
        } else {
          // Fall through to full-text fallback below
        }
      } else {
        // Fallback: read entire response text (non-streaming)
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
            console.info("Fallback text received update:", update);
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
  }, [appendUpdate, makeId, prompt]);

  const cancelJob = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={styles.header}>
        <Text style={styles.title}>AI Agent Runner</Text>
        <Text style={styles.subtitle}>
          Submit a prompt and watch progress stream in real-time.
        </Text>
      </View>

      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          placeholder="Describe the task for the agent..."
          placeholderTextColor="#9aa0a6"
          multiline
          value={prompt}
          onChangeText={setPrompt}
          editable={!isRunning}
        />
        <View style={styles.actions}>
          {!isRunning ? (
            <Button
              title="Run Job"
              onPress={runJob}
              disabled={!prompt.trim()}
            />
          ) : (
            <Button title="Stop" color="#c62828" onPress={cancelJob} />
          )}
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Input tokens: {latestInputTokens}</Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>Output tokens: {latestOutputTokens}</Text>
      </View>

      <View style={styles.streamBox}>
        <ScrollView
          ref={(r) => {
            scrollRef.current = r;
          }}
          style={{ flex: 1 }}
          contentContainerStyle={styles.streamContent}
        >
          {updates.length === 0 && !isRunning && !error ? (
            <Text style={styles.emptyText}>No updates yet.</Text>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {updates.map((u) => (
            <View key={u.key} style={styles.updateCard}>
              <Text style={styles.updateTime}>
                {new Date(u.timestamp).toLocaleTimeString()}
              </Text>
              {u.messages.map((m, i) => (
                <Text key={`${u.key}-m-${i}`} style={styles.updateText}>
                  {m}
                </Text>
              ))}
              {u.isFinal ? <Text style={styles.finalBadge}>Final</Text> : null}
            </View>
          ))}
        </ScrollView>
        {isRunning && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" />
            <Text style={styles.loadingText}>Running...</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Server: http://localhost:3000</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: (Constants.statusBarHeight || 0) + 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#202124",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#5f6368",
  },
  inputBox: {
    marginTop: 12,
    marginHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#dadce0",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fafafa",
  },
  input: {
    minHeight: 100,
    padding: 12,
    fontSize: 16,
    color: "#202124",
  },
  actions: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e0e0e0",
    padding: 8,
    backgroundColor: "#fff",
  },
  metaRow: {
    marginTop: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: "#5f6368",
  },
  metaDot: { color: "#9aa0a6", marginHorizontal: 8 },
  streamBox: {
    flex: 1,
    marginTop: 12,
    marginHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  streamContent: {
    padding: 12,
  },
  emptyText: {
    textAlign: "center",
    color: "#9aa0a6",
  },
  errorText: {
    color: "#c62828",
    marginBottom: 8,
  },
  updateCard: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
  },
  updateTime: {
    fontSize: 10,
    color: "#9aa0a6",
    marginBottom: 4,
  },
  updateText: {
    fontSize: 14,
    color: "#202124",
    lineHeight: 20,
  },
  finalBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    overflow: "hidden",
  },
  loadingOverlay: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffffee",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
  },
  loadingText: {
    fontSize: 12,
    color: "#5f6368",
    marginLeft: 8,
  },
  footer: {
    padding: 12,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#9aa0a6",
  },
});
