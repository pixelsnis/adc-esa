import { StyleSheet } from "react-native";

export const colors = {
  primary: "#007bff",
  secondary: "#6c757d",
  success: "#28a745",
  danger: "#dc3545",
  warning: "#ffc107",
  info: "#17a2b8",
  light: "#f8f9fa",
  dark: "#212529",
  white: "#ffffff",
  gray: {
    100: "#f8f9fa",
    200: "#e9ecef",
    300: "#dee2e6",
    400: "#ced4da",
    500: "#adb5bd",
    600: "#6c757d",
    700: "#495057",
    800: "#343a40",
    900: "#212529",
  },
} as const;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  header: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[600],
  },
  inputContainer: {
    padding: 20,
    backgroundColor: colors.white,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: colors.gray[600],
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: "#f8d7da",
    padding: 12,
    margin: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f5c6cb",
  },
  errorText: {
    color: "#721c24",
    fontSize: 14,
  },
  updatesContainer: {
    flex: 1,
    padding: 20,
  },
  emptyText: {
    textAlign: "center",
    color: colors.gray[600],
    fontSize: 14,
    marginTop: 40,
  },
  updateItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  updateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  updateTime: {
    fontSize: 12,
    color: colors.gray[600],
  },
  tokenInfo: {
    fontSize: 12,
    color: colors.primary,
  },
  updateMessage: {
    fontSize: 14,
    color: colors.dark,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  loadingText: {
    marginTop: 12,
    color: colors.gray[600],
    fontSize: 14,
  },
  tokenUsage: {
    backgroundColor: "#e7f3ff",
    padding: 12,
    margin: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#b3d9ff",
  },
  tokenUsageText: {
    color: "#0056b3",
    fontSize: 12,
    textAlign: "center",
  },
});
