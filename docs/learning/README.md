# DevDocs AI Copilot Learning Guide

Use this guide to learn the project from beginner to builder. Read one day at a
time, trace the real code, run the checks, then explain the flow back in your
own words.

## What This Project Is

DevDocs AI Copilot is a document-based AI app.

You upload documents. Backend extracts text, splits it into chunks, creates
embeddings with Cloudflare AI, stores vectors in Postgres with pgvector, then
answers questions by retrieving relevant chunks. It also has chat history and
an agent mode that runs a multi-step LangGraph workflow.

## Learning Order

1. [Day 1 - Foundation](./day-01-foundation.md): repo shape, NestJS, Vite,
   shared types, env.
2. [Day 2 - Auth](./day-02-auth.md): register/login, JWT, guards, protected UI.
3. [Day 3 - Documents](./day-03-documents.md): upload, storage, PDF/text
   extraction, BullMQ, statuses.
4. [Day 4 - Embeddings and Vector Search](./day-04-embeddings-and-vector-search.md):
   chunking, embeddings, pgvector, similarity search.
5. [Day 5 - RAG Chat](./day-05-rag-chat.md): prompts, grounded answers,
   citations, chat history.
6. [Day 6 - Agentic RAG](./day-06-agentic-rag.md): LangGraph state, nodes,
   retries, run timeline.
7. [Day 7 - Review and Next Steps](./day-07-review-and-next.md): tests,
   telemetry, gaps, final explanation practice.

Extra reference:

- [Feature Map](./feature-map.md): what is implemented, partial, and missing.
- [Code Traces](./code-traces.md): end-to-end request maps with file refs.
- [Exercises](./exercises.md): small tasks to prove understanding.

## How To Study Each Day

1. Read the goal.
2. Open the listed files.
3. Trace the flow from UI or controller to service to DB/API.
4. Run the suggested test command.
5. Write a 5-line summary in your own words.

## Commands

Run these from repo root unless command says `cd`.

```powershell
bun --cwd apps/backend test
bun --cwd apps/frontend test
bun run build:shared
cd apps/backend; bun run build; cd ../..
cd apps/frontend; bun run build; cd ../..
```

## What To Remember

- Frontend uses React, React Router, React Query, Zustand, Tailwind.
- Backend uses NestJS modules, controllers, services, TypeORM, BullMQ.
- Shared package holds enum/types used by both sides.
- RAG means: embed question -> retrieve chunks -> build context -> ask model.
- Agentic RAG means: use a graph of decision steps around RAG.
- Some production hardening is not finished. See [Feature Map](./feature-map.md).

