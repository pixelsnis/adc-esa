import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import { styles } from "../styles";

interface JobInputProps {
  prompt: string;
  onPromptChange: (text: string) => void;
  onRunJob: () => void;
  onStopJob: () => void;
  isRunning: boolean;
}

export function JobInput({
  prompt,
  onPromptChange,
  onRunJob,
  onStopJob,
  isRunning,
}: JobInputProps) {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Enter your prompt..."
        placeholderTextColor="#999"
        value={prompt}
        onChangeText={onPromptChange}
        multiline
        editable={!isRunning}
      />

      <TouchableOpacity
        style={[
          styles.button,
          (!prompt.trim() || isRunning) && styles.buttonDisabled,
        ]}
        onPress={isRunning ? onStopJob : onRunJob}
        disabled={!prompt.trim() && !isRunning}
      >
        {isRunning ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.buttonText}>Stop Job</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Run Job</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
