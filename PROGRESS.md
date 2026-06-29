# DevDocs AI Copilot — Build Progress

Tracks execution of [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), task by task.
Workflow: implement one task → tests green → commit → ask before next task.

**Status:** 14 / 29 tasks complete · currently at **M1.9**
**Last updated:** 2026-06-29

---

## Environment notes

| Tool | State |
|------|-------|
| bun 1.3.14 / node 24 / git | ✅ available |
| Docker | ❌ removed (per request) — using local Postgres |
| Postgres 18 (`localhost:5432`, `postgres`/`postgres`, db `devdocs`) | ✅ reachable, db created |
| pgvector extension | ⛔ **NOT installed** (needs admin) — blocks live migration only |
| Redis (`localhost:6379`) | ⏳ needed at M4 only, not yet set up |

Live-DB steps (migration run, end-to-end browser flows) are **deferred** until pgvector is
installed — see [docs/LOCAL_DB_SETUP.md](docs/LOCAL_DB_SETUP.md). All code is unit-tested
with mocks, so building continues independently.

---

## ✅ Done

### Milestone 0 — Scaffolding & Infra
- [x] **0.1** Bun workspace root + `@devdocs/shared` types package (compiles to `dist`)
- [x] **0.2** Local Postgres/Redis env config (`.env`, `.env.example`); Docker removed; setup script `scripts/setup-local-db.ps1`
- [x] **0.3** NestJS backend bootstrap + validated `ConfigModule` (boot verified: "Nest application successfully started")
- [x] **0.4** Vite + React + Tailwind + React Query bootstrap (production build verified)

### Milestone 1 — Basic RAG (in progress)
- [x] **1.1** DB layer: `vectorTransformer` (3 tests), `User`/`Document`/`DocumentChunk` entities, `AppDataSource`, `InitM1` migration (tables + HNSW cosine index). *Live `migration:run` deferred (pgvector).*
- [x] **1.2** `CloudflareAiService` `embed()`/`chat()` + `CloudflareAiModule` (3 tests, fetch mocked)
- [x] **1.3** Auth + Users: JWT register/login, `JwtAuthGuard`, `@CurrentUser`, DTOs (5 tests). TypeORM root wired with explicit entities; app **boots + connects to live DB** and registers `/api/auth`. *Live register/login deferred (needs migration → pgvector).*
- [x] **1.4** Token-aware chunking utility (`chunkText`) + tests
- [x] **1.5** Embeddings pipeline: chunk → embed → persist `DocumentChunk` rows (2 tests)
- [x] **1.6** DocumentsModule: JWT upload/process/list/get/delete for txt/md (6 tests)
- [x] **1.7** RagModule: pgvector retrieval + grounded answer with citations (4 tests)
- [x] **1.8** Frontend auth store/hooks, protected routes, Login + Dashboard shells (1 test)

**Tests:** 25 backend specs passing · 1 frontend test passing · backend `nest build` clean · frontend `vite build` clean · backend boots against live `devdocs` DB

---

## ⏳ Remaining

### Milestone 1 — Basic RAG
- [ ] **1.9** Frontend — FileUploader + Upload/List documents pages
- [ ] **1.10** Frontend — ChatWindow + RAG query + citations (**M1 end-to-end**)

### Milestone 2 — PDF, Chat History, Citations, Doc Management
- [ ] **2.1** PDF text extraction (`pdf-parse`)
- [ ] **2.2** ChatModule — persisted sessions + messages
- [ ] **2.3** Frontend — chat history sidebar + richer citations
- [ ] **2.4** Document management UX (status polling, chunk count, reindex, delete)

### Milestone 3 — LangGraph Agentic Loop
- [ ] **3.1** `agent_runs` + `agent_steps` schema
- [ ] **3.2** Agent state + 8 nodes (classify→rewrite→retrieve→evaluate→retry→generate→verify→final) + tests
- [ ] **3.3** Build graph + AgentsService (run + persist) + tests
- [ ] **3.4** `/agents/query` endpoint + run retrieval
- [ ] **3.5** Frontend — agent mode toggle + step timeline + run details

### Milestone 4 — Production Hardening
- [ ] **4.1** Move document processing to BullMQ queue (needs Redis)
- [ ] **4.2** Cost + token usage tracking
- [ ] **4.3** Request logging interceptor
- [ ] **4.4** Rate limiting on chat/agent endpoints
- [ ] **4.5** Evaluation dashboard
- [ ] **4.6** Deployment guide + Dockerfiles + README

---

## Deferred verifications (need live infra)
- `bun --cwd apps/backend run migration:run` (needs pgvector) — verify `embedding vector(1024)` + HNSW index
- M1–M4 manual browser flows (register, upload, chat, agent timeline, metrics)
- BullMQ worker run (needs Redis) — M4
