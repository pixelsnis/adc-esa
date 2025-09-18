import React from "react";
import { View, Text } from "react-native";
import { styles } from "../styles";

export function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>AI Agent Runner</Text>
      <Text style={styles.subtitle}>
        Submit a prompt and watch progress stream in real-time.
      </Text>
    </View>
  );
}
