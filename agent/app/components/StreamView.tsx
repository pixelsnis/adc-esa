import React, { useRef } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import type { ProgressUpdate } from "@agent-monorepo/types";
import { styles } from "../styles";

type UpdateItem = ProgressUpdate & { key: string };

type Props = {
  updates: UpdateItem[];
  isRunning: boolean;
  error: string | null;
  latestInputTokens: number;
  latestOutputTokens: number;
};

export function StreamView({
  updates,
  isRunning,
  error,
  latestInputTokens,
  latestOutputTokens,
}: Props) {
  const scrollRef = useRef<ScrollView | null>(null);

  // auto-scroll on new updates
  React.useEffect(() => {
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true })
    );
  }, [updates.length]);

  return (
    <>
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
    </>
  );
}
