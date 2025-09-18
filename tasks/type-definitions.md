You are working on the shared types between the client and server of an AI agent orchestrator app.
The client can queue jobs on the server via the frontend, and the server performs those jobs using ReAct agents and streams back progress updates at each step.
Define the shared types for:

### Job Types

```typescript
// Enum for job status
export enum JobStatus {
  QUEUED = "queued",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

// Job interface
export interface Job {
  id: string;
  prompt: string; // User's prompt for the job
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  result?: JobResult; // Optional result when job is completed or failed
}

// Request to queue a new job
export interface JobRequest {
  prompt: string; // User's prompt for the job
}

// Progress update streamed from server
export interface ProgressUpdate {
  jobId: string;
  step: number;
  message: string;
  timestamp: Date;
  isFinal?: boolean; // Indicates if this is the last update
  inputTokens?: number; // Cumulative input tokens used up to this step
  outputTokens?: number; // Cumulative output tokens used up to this step
}

// Result of a completed job
export interface JobResult {
  success: boolean;
  data?: any; // Result data, e.g., agent output
  errorMessage?: string; // Error details if failed
}
```

These types provide a basic structure for job management and progress streaming. For the MVP, we've kept the prompt as a simple string and focused on essential fields.
