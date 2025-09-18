import React from "react";
import { Button, TextInput, View } from "react-native";
import { styles } from "../styles";

type Props = {
  prompt: string;
  setPrompt: (s: string) => void;
  isRunning: boolean;
  onRun: () => void;
  onCancel: () => void;
};

export function InputBox({
  prompt,
  setPrompt,
  isRunning,
  onRun,
  onCancel,
}: Props) {
  return (
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
          <Button title="Run Job" onPress={onRun} disabled={!prompt.trim()} />
        ) : (
          <Button title="Stop" color="#c62828" onPress={onCancel} />
        )}
      </View>
    </View>
  );
}
