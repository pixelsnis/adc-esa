import React, { useRef, type ReactNode } from "react";
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

  const parseMarkdown = (text: string): ReactNode[] => {
    const nodes: ReactNode[] = [];
    let pos = 0;
    const patterns = [
      { regex: /\*\*([^*]+?)\*\*/g, style: styles.textBold, capture: 1 },
      { regex: /\*([^*]+?)\*/g, style: styles.textItalic, capture: 1 },
      { regex: /`([^`]+?)`/g, style: styles.textCode, capture: 1 },
    ];
    while (pos < text.length) {
      let nextMatch: { pat: any; m: RegExpExecArray } | null = null;
      let minIndex = Infinity;
      for (const pat of patterns) {
        pat.regex.lastIndex = pos;
        const m = pat.regex.exec(text);
        if (m && m.index >= pos && m.index < minIndex) {
          minIndex = m.index;
          nextMatch = { pat, m };
        }
      }
      if (nextMatch) {
        const plain = text.slice(pos, nextMatch.m.index);
        if (plain) {
          nodes.push(<Text>{plain}</Text>);
        }
        nodes.push(
          <Text style={nextMatch.pat.style}>
            {nextMatch.m[nextMatch.pat.capture]}
          </Text>
        );
        pos = nextMatch.m.index + nextMatch.m[0].length;
      } else {
        const remaining = text.slice(pos);
        if (remaining) {
          nodes.push(<Text>{remaining}</Text>);
        }
        break;
      }
    }
    return nodes;
  };

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
                  {parseMarkdown(m)}
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
