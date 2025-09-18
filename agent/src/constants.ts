// App configuration constants
export const SERVER_URL = __DEV__
  ? "http://localhost:3000"
  : "https://your-deployed-server.com";

// API endpoints
export const API_ENDPOINTS = {
  RUN_JOB: "/v1/run",
} as const;

// UI constants
export const UI_CONSTANTS = {
  MAX_PROMPT_LENGTH: 1000,
  DEBOUNCE_DELAY: 300,
} as const;
