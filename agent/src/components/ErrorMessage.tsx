import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../styles";

interface ErrorMessageProps {
  error: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ error, onDismiss }: ErrorMessageProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Error: {error}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={{ marginTop: 8 }}>
          <Text style={[styles.errorText, { textDecorationLine: "underline" }]}>
            Dismiss
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
