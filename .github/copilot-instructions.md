# AI Agent Runner - Copilot Instructions

## Architecture Overview

This is a **Bun-based monorepo** with three workspaces: `agent/` (React Native/Expo), `server/` (Express.js), and `types/` (shared TypeScript definitions).

**Key Design Decisions:**

- **Monorepo with workspaces**: Shared types via `@agent-monorepo/types` package
- **Streaming architecture**: Server-Sent Events (SSE) for real-time progress updates
- **Tool-based AI agents**: Uses Vercel's AI SDK with custom tools for web search/scraping
- **Mobile-first**: Expo Router for React Native app with file-based routing

## Core Patterns

### 1. Shared Type System

```typescript
// Always import from shared types package
import { ProgressUpdate, JobStatus } from "@agent-monorepo/types";

// Never redefine these types - they're the single source of truth
```

### 2. AI Agent Framework

```typescript
// Pattern: Define tools with Zod schemas
const braveSearchTool = tool({
  name: "web_search",
  description: "Search the web for relevant information",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ results: z.array(SearchResultSchema) }),
  execute: async ({ query }) => {
    /* implementation */
  },
});

// Pattern: Agent with stop conditions and progress callbacks
const agent = new Agent({
  model: gemini("gemini-2.5-flash"),
  tools: { web_search: braveSearchTool },
  stopWhen: [hasToolCall("send_result")],
  onStepFinish: async (step) => {
    /* stream progress */
  },
});
```

### 3. Server-Sent Events Streaming

```typescript
// Server: Stream progress updates
res.header("Content-Type", "text/event-stream");
res.write(`data: ${JSON.stringify(update)}\n\n`);

// Client: Listen to SSE stream
const eventSource = new EventSource("/v1/run");
eventSource.onmessage = (event) => {
  const update: ProgressUpdate = JSON.parse(event.data);
};
```

### 4. Workspace Dependencies

```json
// Root package.json - defines workspaces
{
  "workspaces": ["agent", "server", "types"],
  "dependencies": {
    "@agent-monorepo/types": "workspace:*"
  }
}
```

## Development Workflows

### Running the Full Stack

```bash
# Install all dependencies
bun install

# Start server (port 3000)
cd server && bun run index.ts

# Start Expo app (separate terminal)
cd agent && npm start
```

### Environment Variables

```bash
# Server requires:
GEMINI_API_KEY=your_key
BRAVE_SEARCH_API_KEY=your_key
FIRECRAWL_API_KEY=your_key
```

### Build Commands

```bash
# Root: Install all workspaces
bun install

# Agent: Expo commands
npm start          # Development server
npm run android   # Android emulator
npm run ios       # iOS simulator
npm run web       # Web browser

# Server: Direct execution
bun run index.ts
```

## Key Files & Directories

- **`types/index.ts`**: Single source of truth for all shared interfaces
- **`server/src/job.ts`**: Main agent orchestration logic
- **`server/src/tools.ts`**: Custom tool implementations (search, scrape, send_result)
- **`agent/app/_layout.tsx`**: Expo Router root layout
- **`tasks/`**: Project specifications and requirements

## Integration Patterns

### External APIs

- **Google AI (Gemini)**: For agent reasoning via `@ai-sdk/google`
- **Brave Search**: Web search via REST API
- **Firecrawl**: Web scraping via `@mendable/firecrawl-js`

### Error Handling

```typescript
// Pattern: Graceful degradation with logging
try {
  const result = await externalAPI.call();
} catch (err) {
  console.error("API call failed:", err);
  return { results: [] }; // Return safe defaults
}
```

### Progress Streaming

```typescript
// Always include token usage in progress updates
const update: ProgressUpdate = {
  jobId: id,
  messages: updates,
  timestamp: new Date(),
  inputTokens: step.usage.inputTokens,
  outputTokens: step.usage.outputTokens,
};
```

## Code Style Conventions

### TypeScript

- **Strict mode enabled** with some relaxations (`noUnusedLocals: false`)
- **ESNext target** with modern JavaScript features
- **Zod schemas** for runtime type validation

### React Native

- **Expo Router** with file-based routing (`app/` directory)
- **Shared types** imported from workspace package
- **Minimal state management** (useState/useEffect)

### Server

- **Express.js** with JSON middleware
- **Async/await** throughout (no callbacks)
- **Console logging** for debugging (production-ready)

## Common Pitfalls

1. **Don't redefine shared types** - always import from `@agent-monorepo/types`
2. **Use absolute paths** for workspace navigation
3. **Handle SSE connection errors** - implement reconnection logic
4. **Validate environment variables** at startup
5. **Stream progress updates** even for intermediate steps

## Testing Strategy

- **Manual testing** via Expo Go for mobile features
- **API testing** via curl/Postman for server endpoints
- **Integration testing** by running full agent workflows
- **Environment isolation** - test with mock API keys

## Deployment Considerations

- **Server**: Deploy to services supporting Bun runtime
- **Mobile**: Build via Expo Application Services (EAS)
- **Environment**: Separate API keys for staging/production
- **CORS**: Configure for deployed server URL
