import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { useAgentRunner } from "./hooks/useAgentRunner";
import { Header } from "./components/Header";
import { InputBox } from "./components/InputBox";
import { StreamView } from "./components/StreamView";
import { styles } from "./styles";

export default function Index() {
  const [prompt, setPrompt] = useState("");
  const {
    updates,
    isRunning,
    error,
    latestInputTokens,
    latestOutputTokens,
    run,
    cancel,
  } = useAgentRunner();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <Header />

      <InputBox
        prompt={prompt}
        setPrompt={setPrompt}
        isRunning={isRunning}
        onRun={() => run(prompt)}
        onCancel={() => cancel()}
      />

      <StreamView
        updates={updates}
        isRunning={isRunning}
        error={error}
        latestInputTokens={latestInputTokens}
        latestOutputTokens={latestOutputTokens}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Server: http://localhost:3000</Text>
      </View>
    </KeyboardAvoidingView>
  );
}
