# Feature Map

This file separates what works from what remains. Use it before learning a
feature so you do not study planned work as if it already exists.

## Implemented

| Area | Status | Where To Look |
| --- | --- | --- |
| Monorepo | Implemented | `package.json`, `apps/backend`, `apps/frontend`, `packages/shared` |
| Shared types | Implemented | `packages/shared/src/index.ts` |
| Backend bootstrap | Implemented | `apps/backend/src/main.ts`, `apps/backend/src/app.module.ts` |
| Frontend shell | Implemented | `apps/frontend/src/router.tsx`, `apps/frontend/src/components/AppShell.tsx` |
| Auth | Implemented | `apps/backend/src/auth`, `apps/frontend/src/api/auth.ts`, `apps/frontend/src/stores/auth.ts` |
| JWT protected APIs | Implemented | `JwtAuthGuard`, `@CurrentUser`, controllers under `documents`, `chat`, `rag`, `agents` |
| Document upload | Implemented | `DocumentsController.upload`, `DocumentsService.create` |
| Local file storage | Implemented | `apps/backend/src/documents/storage.service.ts` |
| PDF/text extraction | Implemented | `apps/backend/src/documents/text-extraction.ts` |
| BullMQ document processing | Implemented | `documents.queue.ts`, `documents.processor.ts`, Redis config in `docker-compose.yml` |
| Chunking | Implemented | `apps/backend/src/embeddings/chunking.ts` |
| Embeddings | Implemented | `EmbeddingsService.processDocument`, `CloudflareAiService.embed` |
| pgvector retrieval | Implemented | `RagService.retrieve`, `DocumentChunk.embedding`, vector migration |
| RAG answer + citations | Implemented | `RagService.answer`, `rag.utils.ts`, `prompts.ts` |
| Chat sessions/history | Implemented | `ChatService`, `ChatController`, frontend `api/chat.ts` |
| Agentic RAG | Implemented | `AgentsService`, `agents/graph/*`, `AgentStepTimeline` |
| Agent run persistence | Implemented | `AgentRun`, `AgentStep`, `/agents/runs` API |
| Usage tracking | Implemented in code | `TelemetryModule`, `UsageService`, `ai_usage` migration, Cloudflare AI recorder |
| Unit/component tests | Implemented | Backend `*.spec.ts`, frontend `*.test.tsx` |

## Partial Or Needs Manual Verification

| Area | Status | Note |
| --- | --- | --- |
| Browser flows | Needs manual verification | Register, upload, chat, agent timeline, metrics |
| BullMQ live worker flow | Needs manual verification | Docker/Redis must run, then upload should move `pending -> processing -> ready` |
| Usage tracking rollout | Code exists, progress doc stale | `PROGRESS.md` still lists 4.2 unchecked |
| Local services | Environment dependent | Docker daemon must run for Postgres/Redis checks |

## Missing From Current Repo

| Area | Status | Expected Later |
| --- | --- | --- |
| Request logging interceptor | Missing | Global Nest interceptor with method/path/status/duration logs |
| Rate limiting | Missing | Throttling on chat, RAG, and agent endpoints |
| Evaluation dashboard | Missing | Metrics API plus frontend dashboard for usage/eval data |
| Deployment docs | Missing | `README.md`, `docs/DEPLOYMENT.md` |
| Dockerfiles | Missing | Backend and frontend Dockerfiles |

## Learning Rule

If code exists, learn it by tracing files. If only `IMPLEMENTATION_PLAN.md` says
it should exist, treat it as future work until repo has files/tests for it.

