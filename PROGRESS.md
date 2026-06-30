# DevDocs AI Copilot — Build Progress

Tracks execution of [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), task by task.
Workflow: implement one task → tests green → commit → ask before next task.

**Status:** 30 / 35 tasks complete · currently at **M4.2**
**Last updated:** 2026-06-30

---

## Environment notes

| Tool | State |
|------|-------|
| bun 1.3.14 / node 24 / git | ✅ available |
| Docker | ✅ compose running Postgres + pgAdmin |
| Postgres 18 (`localhost:5433`, `postgres`/`postgres`, db `devdocs`) | ✅ healthy |
| pgvector extension | ✅ installed in Docker DB |
| Redis (`localhost:6379`) | ✅ running through Docker Compose |

Live DB migrations are applied through M4.1. Browser flows still need manual verification.

---

## ✅ Done

### Milestone 0 — Scaffolding & Infra
- [x] **0.1** Bun workspace root + `@devdocs/shared` types package (compiles to `dist`)
- [x] **0.2** Local Postgres/Redis env config (`.env`, `.env.example`); Docker removed; setup script `scripts/setup-local-db.ps1`
- [x] **0.3** NestJS backend bootstrap + validated `ConfigModule` (boot verified: "Nest application successfully started")
- [x] **0.4** Vite + React + Tailwind + React Query bootstrap (production build verified)

### Milestone 1 — Basic RAG (in progress)
- [x] **1.1** DB layer: `vectorTransformer` (3 tests), `User`/`Document`/`DocumentChunk` entities, `AppDataSource`, `InitM1` migration (tables + HNSW cosine index). *Live migration applied.*
- [x] **1.2** `CloudflareAiService` `embed()`/`chat()` + `CloudflareAiModule` (3 tests, fetch mocked)
- [x] **1.3** Auth + Users: JWT register/login, `JwtAuthGuard`, `@CurrentUser`, DTOs (5 tests). TypeORM root wired with explicit entities; app **boots + connects to live DB** and registers `/api/auth`.
- [x] **1.4** Token-aware chunking utility (`chunkText`) + tests
- [x] **1.5** Embeddings pipeline: chunk → embed → persist `DocumentChunk` rows (2 tests)
- [x] **1.6** DocumentsModule: JWT upload/process/list/get/delete for txt/md (6 tests)
- [x] **1.7** RagModule: pgvector retrieval + grounded answer with citations (4 tests)
- [x] **1.8** Frontend auth store/hooks, protected routes, Login + Dashboard shells (1 test)
- [x] **1.9** Frontend document upload/list hooks, FileUploader, DocumentCard, pages (1 test)
- [x] **1.10** Frontend ChatWindow + RAG query + citations (**M1 complete**, 1 test)

### Milestone 2 — PDF, Chat History, Citations, Doc Management
- [x] **2.0** Frontend visual system refresh: app shell, status badges, source rail, polished document/upload/chat surfaces
- [x] **2.1** PDF text extraction via `pdf-parse`; backend/frontend upload allowlists include PDFs
- [x] **2.2** ChatModule: persisted sessions/messages over RAG with owner-scoped access
- [x] **2.3** Frontend chat history: sessions sidebar, persisted message replay, citations/confidence
- [x] **2.4** Document management UX: status polling, chunk count, re-index, delete confirm (**M2 complete**)
- [x] **2.5** Theme tokens + premium shell foundation
- [x] **2.6** Dashboard premium overview
- [x] **2.7** Documents + upload premium workflows
- [x] **2.8** Chat premium workspace
- [x] **2.9** Agents and settings pages upgraded from placeholders

### Milestone 3 — LangGraph Agentic Loop
- [x] **3.1** `agent_runs` + `agent_steps` schema
- [x] **3.2** Agent state + 8 nodes (classify→rewrite→retrieve→evaluate→retry→generate→verify→final)
- [x] **3.3** Build graph + `AgentsService` run/persist flow
- [x] **3.4** `/agents/query`, `/agents/runs`, and run details endpoints
- [x] **3.5** Frontend agent mode toggle, run list, step timeline, run details page (**M3 complete**)

### Milestone 4 — Production Hardening
- [x] **4.1** Document processing moved to BullMQ queue with local storage + Redis compose service

**Tests:** 58 backend specs passing · 16 frontend tests passing · backend `nest build` clean · frontend `vite build` clean · backend boot smoke clean

---

## ⏳ Remaining

### Milestone 1 — Basic RAG
All M1 code tasks complete. Manual browser verification remains.

### Milestone 4 — Production Hardening
- [ ] **4.2** Cost + token usage tracking
- [ ] **4.3** Request logging interceptor
- [ ] **4.4** Rate limiting on chat/agent endpoints
- [ ] **4.5** Evaluation dashboard
- [ ] **4.6** Deployment guide + Dockerfiles + README

---

## Deferred verifications (need manual browser run)
- M1–M4 manual browser flows (register, upload, chat, agent timeline, metrics)
- BullMQ upload worker flow (upload → processing → ready)
