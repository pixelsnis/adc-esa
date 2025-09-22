# AI Agent Runner

A Bun-based monorepo with React Native/Expo client (`agent/`), Express.js server (`server/`), and shared types (`types/`).

## Prerequisites

- [Bun](https://bun.sh) (v1.1.26 or later)
- API Keys (set as environment variables):
  - `GEMINI_API_KEY` (Google AI Gemini)
  - `BRAVE_SEARCH_API_KEY` (Brave Search)
  - `FIRECRAWL_API_KEY` (Firecrawl)

## Installation

Install dependencies for all workspaces:

```bash
bun install
```

## Running the Application

1. **Start the Server** (one terminal):

   ```bash
   cd server
   bun run index.ts
   ```

   Server runs on `http://localhost:3000`.

2. **Start the Expo App** (separate terminal):
   ```bash
   cd agent
   bunx expo start
   ```
   - Android: `bunx expo run:android`
   - iOS: `bunx expo run:ios`
   - Web: `bunx expo start --web`
