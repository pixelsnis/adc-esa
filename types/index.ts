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
  result?: JobResult; // Optional result when job is completed or failed
}

// Request to queue a new job
export interface JobRequest {
  prompt: string; // User's prompt for the job
}

// Progress update streamed from server
export interface ProgressUpdate {
  jobId: string;
  messages: string[];
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
  inputTokens?: number; // Number of input tokens used
  outputTokens?: number; // Number of output tokens used
}
