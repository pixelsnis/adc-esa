import { StyleSheet } from "react-native";
import Constants from "expo-constants";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: (Constants.statusBarHeight || 0) + 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#202124",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#5f6368",
  },
  inputBox: {
    marginTop: 12,
    marginHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#dadce0",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fafafa",
  },
  input: {
    minHeight: 100,
    padding: 12,
    fontSize: 16,
    color: "#202124",
  },
  actions: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e0e0e0",
    padding: 8,
    backgroundColor: "#fff",
  },
  metaRow: {
    marginTop: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: "#5f6368",
  },
  metaDot: { color: "#9aa0a6", marginHorizontal: 8 },
  streamBox: {
    flex: 1,
    marginTop: 12,
    marginHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  streamContent: {
    padding: 12,
  },
  emptyText: {
    textAlign: "center",
    color: "#9aa0a6",
  },
  errorText: {
    color: "#c62828",
    marginBottom: 8,
  },
  updateCard: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
  },
  updateTime: {
    fontSize: 10,
    color: "#9aa0a6",
    marginBottom: 4,
  },
  updateText: {
    fontSize: 14,
    color: "#202124",
    lineHeight: 20,
  },
  finalBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    overflow: "hidden",
  },
  loadingOverlay: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffffee",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
  },
  loadingText: {
    fontSize: 12,
    color: "#5f6368",
    marginLeft: 8,
  },
  footer: {
    padding: 12,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#9aa0a6",
  },
});
