import React from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { ProgressUpdate } from "@agent-monorepo/types";
import { styles } from "../styles";

interface ProgressListProps {
  updates: ProgressUpdate[];
  isRunning: boolean;
  error: string | null;
}

export function ProgressList({ updates, isRunning, error }: ProgressListProps) {
  if (updates.length === 0 && !isRunning && !error) {
    return (
      <ScrollView style={styles.updatesContainer}>
        <Text style={styles.emptyText}>
          No jobs run yet. Enter a prompt and click &quot;Run Job&quot; to
          start.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.updatesContainer}>
      {updates.map((update, index) => (
        <View key={index} style={styles.updateItem}>
          <View style={styles.updateHeader}>
            <Text style={styles.updateTime}>
              {update.timestamp.toLocaleTimeString()}
            </Text>
            {update.inputTokens !== undefined &&
              update.outputTokens !== undefined && (
                <Text style={styles.tokenInfo}>
                  Tokens: {update.inputTokens + update.outputTokens}
                </Text>
              )}
          </View>
          {update.messages.map((message, msgIndex) => (
            <Text key={msgIndex} style={styles.updateMessage}>
              {message}
            </Text>
          ))}
        </View>
      ))}

      {isRunning && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Processing your request...</Text>
        </View>
      )}
    </ScrollView>
  );
}
