import React from "react";
import { View, Text, SafeAreaView } from "react-native";
import { useJobState } from "../src/hooks/useJobState";
import {
  JobInput,
  ProgressList,
  ErrorMessage,
  TokenUsage,
  ErrorBoundary,
} from "../src/components";
import { styles } from "../src/styles";

function AppContent() {
  const {
    prompt,
    setPrompt,
    updates,
    isRunning,
    error,
    runJob,
    stopJob,
    clearError,
    getTotalTokens,
  } = useJobState();

  const tokenUsage = getTotalTokens();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Agent Runner</Text>
        <Text style={styles.subtitle}>
          Submit prompts and watch real-time progress
        </Text>
      </View>

      <JobInput
        prompt={prompt}
        onPromptChange={setPrompt}
        onRunJob={runJob}
        onStopJob={stopJob}
        isRunning={isRunning}
      />

      {error && <ErrorMessage error={error} onDismiss={clearError} />}

      <ProgressList updates={updates} isRunning={isRunning} error={error} />

      {tokenUsage && (
        <TokenUsage
          inputTokens={tokenUsage.input}
          outputTokens={tokenUsage.output}
        />
      )}
    </SafeAreaView>
  );
}

export default function Index() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
