# Code Traces

Use these maps when you feel lost. Start at the first line, open each file, and
follow data movement.

## 1. Login/Register -> JWT -> Protected API

Flow:

1. User opens `/login` through frontend routes in `apps/frontend/src/router.tsx:16`.
2. Login/register hooks post to backend from `apps/frontend/src/api/auth.ts`.
3. Backend receives `/api/auth/register` or `/api/auth/login` in
   `apps/backend/src/auth/auth.controller.ts:11`.
4. `AuthService.register` checks duplicate email, hashes password, creates user,
   then signs JWT in `apps/backend/src/auth/auth.service.ts:21`.
5. `AuthService.login` verifies password and signs JWT in
   `apps/backend/src/auth/auth.service.ts:29`.
6. Frontend stores token in Zustand/localStorage through `stores/auth.ts`.
7. Axios attaches token from `apps/frontend/src/lib/axios.ts`.
8. Protected frontend routes pass through
   `apps/frontend/src/components/ProtectedRoute.tsx:4`.
9. Protected backend controllers use `@UseGuards(JwtAuthGuard)`, where
   `JwtAuthGuard` lives in `apps/backend/src/auth/guards/jwt-auth.guard.ts:5`.
10. JWT payload becomes current user through
    `apps/backend/src/auth/strategies/jwt.strategy.ts:17` and
    `apps/backend/src/auth/decorators/current-user.decorator.ts`.

Mental model: frontend stores a signed token; backend trusts it only after JWT
strategy validates it.

## 2. Upload PDF/TXT -> Queue -> Extraction -> Chunks -> Embeddings -> pgvector

Flow:

1. Upload UI calls document API from `apps/frontend/src/api/documents.ts`.
2. Backend upload endpoint starts in
   `apps/backend/src/documents/documents.controller.ts:35`.
3. File validation allows text/markdown/pdf and max 10 MB in same controller.
4. `DocumentsService.create` creates DB row with `pending` status in
   `apps/backend/src/documents/documents.service.ts:29`.
5. `StorageService.save` writes uploaded buffer to local storage.
6. `DocumentsQueueService.enqueueProcessing` adds BullMQ job in
   `apps/backend/src/documents/documents.queue.ts:20`.
7. `DocumentsProcessor.process` reads job, loads doc + file, then calls
   `processFromBuffer` in `apps/backend/src/documents/documents.processor.ts:20`.
8. `DocumentsService.processFromBuffer` sets `processing`, extracts text, embeds,
   then sets `ready` or `failed` in
   `apps/backend/src/documents/documents.service.ts:44`.
9. `extractText` handles PDF/text in
   `apps/backend/src/documents/text-extraction.ts:6`.
10. `EmbeddingsService.processDocument` chunks and embeds text in
    `apps/backend/src/embeddings/embeddings.service.ts:19`.
11. `chunkText` creates token-aware chunks in
    `apps/backend/src/embeddings/chunking.ts:11`.
12. Each chunk is stored as `DocumentChunk` with vector embedding.

Mental model: upload returns quickly; background worker does expensive parsing
and embedding.

## 3. Chat -> RAG -> Persisted Messages -> Citations

Flow:

1. User opens `/chat` from `apps/frontend/src/router.tsx:21`.
2. `ChatWindow` renders selected session and input in
   `apps/frontend/src/components/ChatWindow.tsx:24`.
3. Normal mode uses `usePostMessage` from `apps/frontend/src/api/chat.ts:55`.
4. Backend receives `POST /chat/sessions/:id/messages` in
   `apps/backend/src/chat/chat.controller.ts:30`.
5. `ChatService.postMessage` saves user message, calls RAG, saves assistant
   message in `apps/backend/src/chat/chat.service.ts:34`.
6. `RagService.answer` retrieves chunks and calls model in
   `apps/backend/src/rag/rag.service.ts:45`.
7. `RagService.retrieve` embeds question and runs pgvector similarity query in
   `apps/backend/src/rag/rag.service.ts:27`.
8. `buildContextText` and `toCitation` shape retrieved chunks in
   `apps/backend/src/rag/rag.utils.ts:14`.
9. `buildAnswerPrompt` creates model messages in
   `apps/backend/src/rag/prompts.ts:16`.
10. `parseConfidence` extracts confidence from answer text in
    `apps/backend/src/rag/prompts.ts:29`.
11. Frontend displays answer/citations through `MessageBubble` and source list.

Mental model: chat is not magic. It saves a user message, asks RAG, then saves
assistant output with citations.

## 4. Agent Mode -> LangGraph Nodes -> Run Timeline

Flow:

1. User toggles agent mode inside `ChatWindow` at
   `apps/frontend/src/components/ChatWindow.tsx:99`.
2. Agent mode calls `useAgentQuery` in `apps/frontend/src/api/agents.ts`.
3. Backend receives `POST /agents/query` in
   `apps/backend/src/agents/agents.controller.ts:14`.
4. `AgentsService.run` invokes compiled graph in
   `apps/backend/src/agents/agents.service.ts:34`.
5. Graph is built by `buildAgentGraph` in
   `apps/backend/src/agents/graph/build-graph.ts:9`.
6. State shape lives in `apps/backend/src/agents/graph/state.ts:12`.
7. Node implementations live in `apps/backend/src/agents/graph/nodes.ts`.
8. Step names are shared enum values in `packages/shared/src/index.ts:17`.
9. Completed run is saved as `AgentRun`, steps saved as `AgentStep`.
10. Frontend lists runs in `apps/frontend/src/pages/AgentRuns.tsx:9`.
11. Frontend shows run details in `apps/frontend/src/pages/AgentRunDetails.tsx:10`.
12. Timeline renders in `apps/frontend/src/components/AgentStepTimeline.tsx:21`.

Node order:

```text
classifyQuestion -> rewriteQuery -> retrieveContext -> evaluateContext
-> retryRetrieval when weak -> generateAnswer -> verifyAnswer
-> retryRetrieval when unverified -> finalResponse
```

Mental model: agent mode wraps RAG with planning, evaluation, retry, and
verification steps. It also records each step for learning/debugging.

## 5. Cloudflare AI -> Usage Recording

Flow:

1. All model calls pass through
   `apps/backend/src/cloudflare-ai/cloudflare-ai.service.ts:6`.
2. `embed` sends text to Cloudflare model and records usage in
   `apps/backend/src/cloudflare-ai/cloudflare-ai.service.ts:34`.
3. `chat` sends messages to Cloudflare model and records usage in
   `apps/backend/src/cloudflare-ai/cloudflare-ai.service.ts:46`.
4. Recorder interface lives in `apps/backend/src/cloudflare-ai/types.ts:21`.
5. `TelemetryModule` wires `USAGE_RECORDER` to `UsageService`.
6. `UsageService.record` stores token counts and estimated cost in
   `apps/backend/src/telemetry/usage.service.ts:16`.
7. DB table is created by
   `apps/backend/src/database/migrations/1700000000005-AiUsage.ts`.

Mental model: usage tracking is attached once at the AI boundary, so embed/chat
callers do not need to know storage details.

