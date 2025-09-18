You are building the frontend for an AI agent runner app. This is a React Native (Expo) application that allows users to submit prompts to an AI agent running on the server, and displays real-time progress updates via Server-Sent Events (SSE).

The frontend communicates with the server at `http://localhost:3000` (or the deployed server URL). It should provide a simple, intuitive interface for users to input prompts, start jobs, and view streaming results.

## Monorepo Structure

This project is organized as a monorepo using workspaces. The shared types are defined in the `types/` directory and published as the `@agent-monorepo/types` package. Import shared types like `ProgressUpdate` from this package to ensure consistency between frontend and backend.

## API Integration

The frontend interacts with the server via a single endpoint:

- **POST /v1/run**: Queues a new job and starts streaming progress.
  - Request Body: `{ id: string, prompt: string }`
  - Response: Server-Sent Events stream of `ProgressUpdate` objects.

The `ProgressUpdate` interface is defined in the shared types package. The frontend must:

1. Generate a unique `id` for each job. Use a random string generator, not UUID.
2. Send the POST request with `Content-Type: application/json`.
3. Listen to the SSE stream and parse JSON data.
4. Handle connection errors and display appropriate messages.

## Frontend Components

### Main Screen

The main screen should include:

- A text input for the user's prompt.
- A "Run Job" button to submit the prompt.
- A scrollable area to display progress updates in real-time.
- Display of token usage (input/output) if available.
- Error handling for failed jobs.

### Additional Features

- **Job History**: Optionally, store completed jobs locally for offline viewing.
- **Real-time UI Updates**: Update the UI as new progress updates arrive.
- **Loading States**: Show indicators while the job is running.
- **Error Boundaries**: Handle unexpected errors gracefully.

## State Management

Use React's built-in state management for simplicity:

- `prompt`: Current user input.
- `updates`: Array of received progress updates.
- `isRunning`: Boolean to disable UI during job execution.

## Styling

Design the UI with a highly clean and minimal aesthetic. Use a simple color palette, ample white space, and clean typography. Focus on usability and readability over complex visual elements.

This spec provides instructions for building the frontend. Focus on a clean, responsive UI that makes it easy for users to interact with the AI agent.
