import React from "react";
import { View, Text } from "react-native";
import { styles } from "../styles";

interface TokenUsageProps {
  inputTokens: number;
  outputTokens: number;
}

export function TokenUsage({ inputTokens, outputTokens }: TokenUsageProps) {
  const totalTokens = inputTokens + outputTokens;

  return (
    <View style={styles.tokenUsage}>
      <Text style={styles.tokenUsageText}>
        Total tokens: {totalTokens}
        (Input: {inputTokens}, Output: {outputTokens})
      </Text>
    </View>
  );
}
