# DevDocs AI Copilot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Execution workflow (checkpoint per task):** Implement **one task at a time**. After finishing a task — all its steps done, tests green, committed — **STOP and ask the human partner for approval before starting the next task** (e.g. "Task 1.2 complete and committed. Proceed with Task 1.3?"). Do not batch multiple tasks without an explicit go-ahead.
>
> **Local infrastructure:** Postgres runs through Docker Compose using `pgvector/pgvector:pg18`. Host connection: `localhost:5433`, user `postgres`, password `postgres`, database `devdocs` → `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/devdocs`. pgAdmin runs at `http://localhost:5050`. Redis is needed only from M4.

## Context

We are building **DevDocs AI Copilot** from scratch in an empty directory (`d:\Workspace\own\Agentic-AI\ai-implementation`). It is a full-stack RAG + agentic assistant: users upload technical docs (Markdown, PDFs, API notes, GitHub issue text, deployment notes), the backend chunks + embeds them into Postgres/pgvector, and users ask questions answered **only from retrieved context with source citations**. An optional **LangGraph agentic mode** plans → retrieves → evaluates → retries → answers → verifies, exposing each step in the UI.

This plan is sequenced into milestones so each produces working, testable software on its own:
- **M1** Basic RAG (txt/md upload → chunk → embed → retrieve → answer + sources).
- **M2** PDF support, persisted chat history, structured citations, document management.
- **M2.5** Premium dashboard redesign from `DESIGN.md` (dark-default SaaS shell, pages, polish).
- **M3** LangGraph agentic loop with per-step UI.
- **M4** Production hardening (BullMQ queue, cost tracking, request logs, rate limiting, eval dashboard, deploy guide).

**Goal:** Ship a production-style RAG + agentic copilot where uploaded docs become citable, retrieval-grounded answers, with an inspectable LangGraph agent loop.

**Architecture:** Bun-workspace monorepo. A NestJS REST backend owns all AI calls (never the browser) — `CloudflareAiService` wraps the Cloudflare Workers AI REST API for embeddings (`@cf/baai/bge-large-en-v1.5`, 1024-dim) and chat (`@cf/meta/llama-3.2-3b-instruct`). Postgres + pgvector stores chunks/embeddings; cosine similarity drives retrieval. A Vite React SPA (React Query + Zustand + Tailwind) is the dashboard. LangGraph JS (`@langchain/langgraph`) orchestrates the agentic graph. BullMQ + Redis runs document processing in the background.

**Tech Stack:** TypeScript everywhere · Bun (runtime + workspaces) · NestJS · TypeORM · PostgreSQL 18 + pgvector · Redis + BullMQ (`@nestjs/bullmq`) · `@langchain/langgraph` · Cloudflare Workers AI REST · React 18 + Vite · `@tanstack/react-query` · Zustand · React Router · Tailwind CSS · JWT (`@nestjs/jwt` + passport-jwt) · Jest (backend) · Vitest + Testing Library (frontend).

## Global Constraints

- **Environment variables** (exact names, backend only — never shipped to the browser):
  - `CLOUDFLARE_ACCOUNT_ID=`
  - `CLOUDFLARE_API_TOKEN=`
  - `CLOUDFLARE_CHAT_MODEL=@cf/meta/llama-3.2-3b-instruct`
  - `CLOUDFLARE_EMBEDDING_MODEL=@cf/baai/bge-large-en-v1.5`
  - `DATABASE_URL=`
  - `JWT_SECRET=`
  - `REDIS_URL=`
- **Cloudflare endpoint pattern:** `POST https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/{MODEL_ID}` with header `Authorization: Bearer {CLOUDFLARE_API_TOKEN}`.
- **Embedding dimension is 1024** (bge-large-en-v1.5). Every `vector(1024)` column and any test fixture must use 1024.
- **The Cloudflare API token NEVER reaches the frontend.** All AI calls route through NestJS. Frontend env vars are limited to `VITE_API_URL`.
- **Chunking:** 700–1000 tokens per chunk, 100–150 tokens overlap. Store: chunk text, document id, chunk index, source filename, embedding.
- **Retrieval:** cosine similarity via pgvector (`<=>` operator). Normal RAG returns **top 5–8** chunks. Agentic RAG allows **retry retrieval up to 2 times**.
- **Agent rules (must be enforced in prompts + verification):** never invent facts; say clearly when docs lack the answer; cite document name + chunk number; prefer retrieved context over model memory; answers stay clear, practical, developer-friendly.
- **Security:** JWT on all protected routes; validate uploaded files (type + size); only allow supported types; sanitize extracted text; rate-limit chat/agent endpoints.
- **NestJS hygiene:** DTOs + `class-validator` + global `ValidationPipe({ whitelist: true, transform: true })`; proper modules/services/controllers; `synchronize: false` (migrations only).
- **Final-answer prompt template** (used verbatim by `RagService` and the agent's `generateAnswer`):
  ```
  You are DevDocs AI Copilot, a careful technical assistant.
  Answer the user using only the provided context.
  If the context does not contain enough information, say that clearly.
  Include source citations using document name and chunk number.
  Keep the answer practical, concise, and useful for a software engineer.

  Context:
  {{retrieved_context}}

  User question:
  {{user_question}}
  ```
  Expected model output shape: a clear answer, a short source list, and a confidence level (`High` | `Medium` | `Low`).
- **Bun + NestJS note:** Bun is the package manager and workspace tool. The Nest dev server runs under Bun via the Nest CLI; `tsconfig` must set `"emitDecoratorMetadata": true` and `"experimentalDecorators": true`. If a decorator/metadata edge case ever appears under Bun, fall back to Node for the backend dev server only (`node` is already installed) — install/workspaces stay on Bun.

---

## Frontend Experience Direction

`DESIGN.md` is the source of truth for the product UI direction. The frontend should feel like a premium AI developer dashboard: dark by default, modern, elegant, sharp, high contrast where useful, and calm enough for daily use. It should feel closer to Vercel/Linear/Raycast quality than a generic admin template, without copying any one product directly.

**Design goal:** A software engineer should trust the app within 10 seconds because the UI makes uploaded knowledge, RAG grounding, chat history, citations, and future agent steps feel visible, controlled, and production-ready.

**Visual identity:**
- Theme: dark mode default with light mode support. Theme preference belongs in local UI state and should affect the full shell.
- Dark palette: `Background #0A0A0B`, `Surface #111214`, `Surface 2 #16181D`, `Border rgba(255,255,255,0.08)`, `Text #F5F7FA`, `Secondary #A4ACB9`, `Muted #7B8494`, `Accent Blue #4F8CFF`, `Accent Cyan #35C2FF`, `Accent Violet #8B5CF6`, `Success #22C55E`, `Warning #F59E0B`, `Danger #EF4444`.
- Light palette: `Background #F6F8FB`, `Surface #FFFFFF`, `Surface 2 #F9FAFB`, `Border #E6EAF0`, `Text #0F172A`, `Secondary #475569`, `Muted #64748B`, `Accent Blue #2563EB`, `Accent Cyan #0891B2`, `Accent Violet #7C3AED`, `Success #16A34A`, `Warning #D97706`, `Danger #DC2626`.
- Typography: prefer Geist/Inter/SF Pro style system stack; page titles around 32px semibold, section titles 20-24px, card titles 16-18px, body 14-16px, metadata 12px monospace where useful.
- Shape and depth: radius scale `10/14/18/24px`, soft borders, restrained glow/gradient edges for active states, subtle shadows in light mode, subtle overlays in dark mode.
- Motion: 150-220ms hover/focus/opacity/lift transitions, loading skeletons where useful, reduced motion respected.
- Dependencies: keep the existing stack first. Add `lucide-react` only when icon coverage materially improves the shell/actions. Avoid shadcn/ui or Framer Motion unless a specific component truly needs them.

**Signature interactions:**
- A premium left sidebar with logo/wordmark, grouped navigation, compact profile area, active pill/glow state, and logout pinned at bottom.
- A refined page header on every protected page: eyebrow label, title, supporting description, and page actions.
- A source/citation rail or citation chips that connect answers to document name + chunk number.
- Agent mode later uses timeline/step cards with status, retry count, and expandable details.

**Layout model:**
```text
Desktop
sidebar 260-280px | page header + main workspace | optional context/source rail

Tablet
sidebar can compress; content grids become two columns

Mobile
top bar/drawer navigation; cards stack; chat input remains reachable
```

**Page quality bar:**
- Dashboard: not empty; hero summary, quick actions, stats cards, recent activity/session overview, premium empty state.
- Documents: search, filters/sort, status badges, chunk count, upload time/file type metadata, row/card actions.
- Upload: large polished drag/drop zone, file support copy, progress/processing/completed/failed states, recent uploads.
- Chat: conversation sidebar, premium message layout, citations, suggested prompts, RAG/Agent mode badge, input dock.
- Agents: run list, status badges, node timeline, retry counts, timestamps, final output summary.
- Settings: modular cards for profile, theme preference, model/config status, retrieval settings, security.

**Component quality bar:**
- Buttons: modern medium height, primary luminous but restrained, secondary subtle, visible hover/active/focus states.
- Cards/panels: generous padding, soft border, subtle lift/brighten on hover, no nested decorative cards.
- Inputs: clean borders, strong focus rings, refined search bars, readable labels.
- Badges: small rounded pills with semantic colors.
- Empty states: always include title, useful instruction, primary CTA, and a small visual/icon treatment.
- Accessibility: semantic landmarks, keyboard reachable controls, labels for inputs, color not the only status signal.

**Copy style:** Plain engineering language. Use verbs like "Upload", "Ask", "Re-index", "Delete", "Create chat", "Start agent run". Empty states tell the next action. Errors name failure and recovery.

---

## File Structure

```
ai-implementation/
├─ package.json                      # Bun workspace root: { "workspaces": ["apps/*","packages/*"] }
├─ .env                              # root env (see Global Constraints)
├─ .env.example
├─ tsconfig.base.json
├─ packages/
│  └─ shared/                        # shared TS types (DTO shapes, enums) consumed by both apps
│     ├─ package.json
│     └─ src/index.ts
└─ apps/
   ├─ backend/
   │  ├─ package.json
   │  ├─ tsconfig.json
   │  ├─ nest-cli.json
   │  ├─ ormconfig / src/database/data-source.ts
   │  ├─ src/
   │  │  ├─ main.ts
   │  │  ├─ app.module.ts
   │  │  ├─ config/                  # env validation
   │  │  ├─ database/
   │  │  │  ├─ data-source.ts
   │  │  │  ├─ migrations/
   │  │  │  └─ transformers/vector.transformer.ts
   │  │  ├─ common/                  # guards, interceptors, filters, pipes
   │  │  ├─ cloudflare-ai/           # CloudflareAiModule + service
   │  │  ├─ auth/                    # AuthModule
   │  │  ├─ users/                   # UsersModule
   │  │  ├─ documents/               # DocumentsModule (+ entities, processor)
   │  │  ├─ embeddings/              # EmbeddingsModule
   │  │  ├─ rag/                     # RagModule
   │  │  ├─ chat/                    # ChatModule
   │  │  ├─ agents/                  # AgentsModule (LangGraph graph + nodes)
   │  │  └─ telemetry/               # cost tracking + request logs (M4)
   │  └─ test/                       # e2e
   └─ frontend/
      ├─ package.json
      ├─ vite.config.ts
      ├─ tailwind.config.ts
      ├─ index.html
      └─ src/
         ├─ main.tsx, App.tsx, router.tsx
         ├─ lib/  (axios client, queryClient)
         ├─ stores/ (zustand auth + ui)
         ├─ api/  (typed React Query hooks)
         ├─ pages/ (Login, Dashboard, UploadDocuments, DocumentsList, Chat, AgentRunDetails, Settings)
         └─ components/ (FileUploader, DocumentCard, ChatWindow, MessageBubble,
                         SourceCitationList, AgentStepTimeline, ModelSettingsForm,
                         EmptyState, LoadingState)
```

---

## Milestone 0 — Monorepo Scaffolding & Infrastructure

### Task 0.1: Bun workspace root + shared package

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `.gitignore`, `.env.example`, `packages/shared/package.json`, `packages/shared/src/index.ts`, `packages/shared/tsconfig.json`

**Interfaces:**
- Produces: workspace alias `@devdocs/shared` resolving to `packages/shared/src/index.ts`; shared enums/types `DocumentStatus`, `ChatRole`, `Confidence`, `AgentStepName`, `SourceCitation`, `RagQueryResponse`.

- [ ] **Step 1: Create the workspace root `package.json`**

```json
{
  "name": "devdocs-ai-copilot",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:backend": "bun --cwd apps/backend run start:dev",
    "dev:frontend": "bun --cwd apps/frontend run dev",
    "migration:run": "bun --cwd apps/backend run migration:run"
  },
  "devDependencies": { "typescript": "^5.5.4" }
}
```

- [ ] **Step 2: Create `tsconfig.base.json`** (shared compiler options; decorators ON for NestJS/TypeORM)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": { "@devdocs/shared": ["packages/shared/src/index.ts"] }
  }
}
```

- [ ] **Step 3: Create `packages/shared/src/index.ts`** with the cross-app contracts

```ts
export enum DocumentStatus { PENDING = 'pending', PROCESSING = 'processing', READY = 'ready', FAILED = 'failed' }
export enum ChatRole { USER = 'user', ASSISTANT = 'assistant', SYSTEM = 'system' }
export enum Confidence { HIGH = 'High', MEDIUM = 'Medium', LOW = 'Low' }
export enum AgentStepName {
  CLASSIFY = 'classifyQuestion', REWRITE = 'rewriteQuery', RETRIEVE = 'retrieveContext',
  EVALUATE = 'evaluateContext', RETRY = 'retryRetrieval', GENERATE = 'generateAnswer',
  VERIFY = 'verifyAnswer', FINAL = 'finalResponse',
}
export interface SourceCitation {
  documentId: string; documentName: string; chunkIndex: number; score: number; snippet: string;
}
export interface RagQueryResponse {
  answer: string; citations: SourceCitation[]; confidence: Confidence;
}
```

- [ ] **Step 4: Create `packages/shared/package.json`** (name `@devdocs/shared`, `"main": "src/index.ts"`, `"types": "src/index.ts"`) and `packages/shared/tsconfig.json` extending the base.

- [ ] **Step 5: Run `bun install`** at the root. Expected: workspaces resolve, no errors.

- [ ] **Step 6: Commit**

```bash
git init && git add -A && git commit -m "chore: bun workspace scaffold + shared types package"
```

---

### Task 0.2: Local infra (Docker Postgres+pgvector, pgAdmin, Redis later) + env

Postgres runs through Docker Compose with pgvector preinstalled. Redis is needed only from M4.

**Files:**
- Create: `.env.example`, `.env`, `docker-compose.yml`, `docker/postgres/init/01-extensions.sql`

**Interfaces:**
- Produces: Postgres reachable from the host at `postgresql://postgres:postgres@localhost:5433/devdocs` with the `vector` extension available; pgAdmin at `http://localhost:5050`; Redis at `redis://localhost:6379` from M4 onward.

- [ ] **Step 1: Provision Docker Postgres** — add Compose services for `pgvector/pgvector:pg18` and `dpage/pgadmin4`. Mount Postgres 18 data at `/var/lib/postgresql`, not `/var/lib/postgresql/data`. Use host port `5433` for Postgres and `5050` for pgAdmin.

- [ ] **Step 2: Add DB init SQL** — `docker/postgres/init/01-extensions.sql` creates `vector` and `"uuid-ossp"`. Verify:

```sql
SELECT extname FROM pg_extension WHERE extname IN ('vector', 'uuid-ossp');
```

- [ ] **Step 3: Create `.env.example`** with every variable from Global Constraints (values blank except the model IDs and local URLs), then copy to `.env` and fill Cloudflare creds locally.

```
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_CHAT_MODEL=@cf/meta/llama-3.2-3b-instruct
CLOUDFLARE_EMBEDDING_MODEL=@cf/baai/bge-large-en-v1.5
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/devdocs
JWT_SECRET=change-me-in-prod
REDIS_URL=redis://localhost:6379
PORT=4000
```

- [ ] **Step 4: Verify connectivity + pgvector** — run `bun run db:up`, then `bun run migration:run`. Expected: all migrations apply and `document_chunks.embedding` is `vector(1024)`.

- [ ] **Step 5: Commit** `git add .env.example docker-compose.yml docker/postgres/init/01-extensions.sql && git commit -m "chore: docker postgres pgvector and pgadmin env config"` (`.env` is gitignored).

---

### Task 0.3: NestJS backend bootstrap + typed config

**Files:**
- Create: `apps/backend/package.json`, `apps/backend/tsconfig.json`, `apps/backend/nest-cli.json`, `apps/backend/src/main.ts`, `apps/backend/src/app.module.ts`, `apps/backend/src/config/env.validation.ts`

**Interfaces:**
- Produces: bootstrapped Nest app on `PORT`, global `ValidationPipe`, CORS for the Vite origin, `ConfigModule` with validated env accessible via `ConfigService`.

- [ ] **Step 1: Create `apps/backend/package.json`** with deps and scripts.

```json
{
  "name": "@devdocs/backend",
  "scripts": {
    "start:dev": "nest start --watch",
    "build": "nest build",
    "test": "jest",
    "migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/database/data-source.ts",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/database/data-source.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.4.4", "@nestjs/core": "^10.4.4", "@nestjs/platform-express": "^10.4.4",
    "@nestjs/config": "^3.2.3", "@nestjs/typeorm": "^10.0.2", "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3", "@nestjs/throttler": "^6.2.1", "@nestjs/bullmq": "^10.2.1",
    "typeorm": "^0.3.20", "pg": "^8.12.0", "bullmq": "^5.13.2",
    "passport": "^0.7.0", "passport-jwt": "^4.0.1", "bcrypt": "^5.1.1",
    "class-validator": "^0.14.1", "class-transformer": "^0.5.1",
    "@langchain/langgraph": "^0.2.19", "@langchain/core": "^0.3.16",
    "js-tiktoken": "^1.0.14", "pdf-parse": "^1.1.1", "reflect-metadata": "^0.2.2", "rxjs": "^7.8.1",
    "@devdocs/shared": "workspace:*"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.5", "@nestjs/testing": "^10.4.4", "@types/node": "^22.7.4",
    "@types/bcrypt": "^5.0.2", "@types/passport-jwt": "^4.0.1", "@types/pdf-parse": "^1.1.4",
    "jest": "^29.7.0", "ts-jest": "^29.2.5", "@types/jest": "^29.5.13", "ts-node": "^10.9.2"
  }
}
```

- [ ] **Step 2: Create `apps/backend/src/config/env.validation.ts`** — a `class-validator` schema validated by `ConfigModule.forRoot({ validate })`. Required keys: all from Global Constraints. Throw on missing `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`.

```ts
import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

export class EnvVars {
  @IsString() @IsNotEmpty() CLOUDFLARE_ACCOUNT_ID!: string;
  @IsString() @IsNotEmpty() CLOUDFLARE_API_TOKEN!: string;
  @IsString() CLOUDFLARE_CHAT_MODEL!: string;
  @IsString() CLOUDFLARE_EMBEDDING_MODEL!: string;
  @IsString() @IsNotEmpty() DATABASE_URL!: string;
  @IsString() @IsNotEmpty() JWT_SECRET!: string;
  @IsString() @IsNotEmpty() REDIS_URL!: string;
}
export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvVars, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length) throw new Error(`Config validation failed: ${errors.toString()}`);
  return validated;
}
```

- [ ] **Step 3: Create `apps/backend/src/main.ts`** with global pipe + CORS.

```ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000', credentials: true });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- [ ] **Step 4: Create `apps/backend/src/app.module.ts`** importing `ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })` only (other modules added per later task).

- [ ] **Step 5: Run** `bun --cwd apps/backend run start:dev`. Expected: "Nest application successfully started". Stop it.

- [ ] **Step 6: Commit** `git commit -am "feat(backend): nest bootstrap with validated config"`.

---

### Task 0.4: Vite React frontend bootstrap + Tailwind + providers

**Files:**
- Create: `apps/frontend/package.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/lib/queryClient.ts`, `src/lib/axios.ts`

**Interfaces:**
- Produces: Vite dev server on :3000; React Query `QueryClientProvider`; axios instance `api` reading base URL from `VITE_API_URL` and attaching the JWT from the auth store.

- [ ] **Step 1: Create `apps/frontend/package.json`** with React 18, Vite, React Router, React Query, Zustand, axios, Tailwind, Vitest + Testing Library.

```json
{
  "name": "@devdocs/frontend",
  "scripts": { "dev": "vite", "build": "tsc -b && vite build", "test": "vitest run" },
  "dependencies": {
    "react": "^18.3.1", "react-dom": "^18.3.1", "react-router-dom": "^6.26.2",
    "@tanstack/react-query": "^5.59.0", "zustand": "^4.5.5", "axios": "^1.7.7",
    "@devdocs/shared": "workspace:*"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.2", "vite": "^5.4.8", "typescript": "^5.5.4",
    "tailwindcss": "^3.4.13", "postcss": "^8.4.47", "autoprefixer": "^10.4.20",
    "vitest": "^2.1.2", "@testing-library/react": "^16.0.1", "@testing-library/jest-dom": "^6.5.0",
    "jsdom": "^25.0.1", "@types/react": "^18.3.11", "@types/react-dom": "^18.3.0"
  }
}
```

- [ ] **Step 2: Create `src/lib/axios.ts`** — axios instance with request interceptor injecting `Authorization: Bearer <token>` from the Zustand auth store, and a response interceptor that clears auth on 401.

```ts
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api' });
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((r) => r, (err) => {
  if (err.response?.status === 401) useAuthStore.getState().logout();
  return Promise.reject(err);
});
```

- [ ] **Step 3: Create `src/main.tsx` + `src/App.tsx`** wrapping `QueryClientProvider` + `BrowserRouter` (router filled in Task 1.8). Configure Tailwind (`tailwind.config.ts` content globs `./index.html`, `./src/**/*.{ts,tsx}`; `src/index.css` with the three `@tailwind` directives).

- [ ] **Step 4: Run** `bun --cwd apps/frontend run dev`. Expected: Vite serves at :3000 with a Tailwind-styled placeholder. Stop it.

- [ ] **Step 5: Commit** `git commit -am "feat(frontend): vite+react+tailwind+react-query bootstrap"`.

---

## Milestone 1 — Basic RAG

### Task 1.1: Database layer — TypeORM data source, vector transformer, M1 migration

**Files:**
- Create: `apps/backend/src/database/data-source.ts`, `apps/backend/src/database/transformers/vector.transformer.ts`, `apps/backend/src/users/entities/user.entity.ts`, `apps/backend/src/documents/entities/document.entity.ts`, `apps/backend/src/documents/entities/document-chunk.entity.ts`, `apps/backend/src/database/migrations/1700000000000-InitM1.ts`
- Test: `apps/backend/src/database/transformers/vector.transformer.spec.ts`

**Interfaces:**
- Produces: `AppDataSource` (TypeORM `DataSource`); `vectorTransformer` (`ValueTransformer` converting `number[] <-> '[a,b,...]'`); entities `User`, `Document`, `DocumentChunk` with `DocumentChunk.embedding: number[]` mapped to a `vector(1024)` column; tables `users`, `documents`, `document_chunks` + HNSW cosine index.

- [ ] **Step 1: Write the failing transformer test**

```ts
import { vectorTransformer } from './vector.transformer';
describe('vectorTransformer', () => {
  it('serializes a number array to a pgvector literal', () => {
    expect(vectorTransformer.to([0.1, 0.2, 0.3])).toBe('[0.1,0.2,0.3]');
  });
  it('parses a pgvector literal back to numbers', () => {
    expect(vectorTransformer.from('[0.1,0.2,0.3]')).toEqual([0.1, 0.2, 0.3]);
  });
  it('round-trips null', () => {
    expect(vectorTransformer.to(null as any)).toBeNull();
    expect(vectorTransformer.from(null as any)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** `bun --cwd apps/backend run test -- vector.transformer`. Expected: module not found / function undefined.

- [ ] **Step 3: Implement `vector.transformer.ts`**

```ts
import { ValueTransformer } from 'typeorm';
export const vectorTransformer: ValueTransformer = {
  to: (value: number[] | null) => (value == null ? null : `[${value.join(',')}]`),
  from: (value: string | null) => (value == null ? null : (JSON.parse(value) as number[])),
};
```

- [ ] **Step 4: Run the test, expect PASS.**

- [ ] **Step 5: Create the entities.** `User` (`id uuid pk`, `email unique`, `passwordHash`, `createdAt`). `Document` (`id`, `userId`, `filename`, `mimeType`, `sizeBytes`, `status: DocumentStatus`, `error nullable`, `createdAt`, `updatedAt`). `DocumentChunk` (`id`, `documentId`, `chunkIndex int`, `content text`, `sourceFilename`, `tokenCount int`, `embedding number[]` via `@Column({ type: 'text', transformer: vectorTransformer, select: false })` — DDL for the real `vector(1024)` column comes from the migration, not synchronize). Add relations + indexes on `documentId`, `userId`.

- [ ] **Step 6: Create `data-source.ts`** (`synchronize: false`, `entities: [...]`, `migrations: ['src/database/migrations/*.ts']`, url from `DATABASE_URL`).

- [ ] **Step 7: Write the M1 migration** `1700000000000-InitM1.ts` (hand-written, since the vector column + index are not entity-derivable):

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';
export class InitM1_1700000000000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
    await q.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await q.query(`CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      email varchar(255) UNIQUE NOT NULL,
      password_hash varchar(255) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now());`);
    await q.query(`CREATE TABLE documents (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename varchar(512) NOT NULL,
      mime_type varchar(128) NOT NULL,
      size_bytes integer NOT NULL,
      status varchar(32) NOT NULL DEFAULT 'pending',
      error text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now());`);
    await q.query(`CREATE TABLE document_chunks (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      chunk_index integer NOT NULL,
      content text NOT NULL,
      source_filename varchar(512) NOT NULL,
      token_count integer NOT NULL,
      embedding vector(1024));`);
    await q.query(`CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);`);
    await q.query(`CREATE INDEX idx_chunks_embedding ON document_chunks
      USING hnsw (embedding vector_cosine_ops);`);
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE document_chunks; DROP TABLE documents; DROP TABLE users;`);
  }
}
```

- [ ] **Step 8: Run the migration** `bun --cwd apps/backend run migration:run`. Expected: tables + indexes created. Verify with `psql ... -c "\d document_chunks"` showing `embedding | vector(1024)`.

- [ ] **Step 9: Commit** `git commit -am "feat(db): typeorm datasource, vector transformer, M1 schema migration"`.

---

### Task 1.2: CloudflareAiModule + CloudflareAiService (embed + chat) + unit tests

**Files:**
- Create: `apps/backend/src/cloudflare-ai/cloudflare-ai.module.ts`, `apps/backend/src/cloudflare-ai/cloudflare-ai.service.ts`, `apps/backend/src/cloudflare-ai/types.ts`
- Test: `apps/backend/src/cloudflare-ai/cloudflare-ai.service.spec.ts`

**Interfaces:**
- Produces: `CloudflareAiService.embed(texts: string[]): Promise<number[][]>` (each vector length 1024); `CloudflareAiService.chat(messages: ChatMessage[], opts?: { maxTokens?: number; temperature?: number }): Promise<{ text: string; usage?: TokenUsage }>`; type `ChatMessage = { role: 'system'|'user'|'assistant'; content: string }`. Exported from `CloudflareAiModule`.

- [ ] **Step 1: Write the failing test** (mock `global.fetch`; assert URL pattern, Bearer header, embeddings parsing, chat parsing, error throw on `success:false`).

```ts
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CloudflareAiService } from './cloudflare-ai.service';

const cfg = (k: string) => ({
  CLOUDFLARE_ACCOUNT_ID: 'acc123', CLOUDFLARE_API_TOKEN: 'tok456',
  CLOUDFLARE_CHAT_MODEL: '@cf/meta/llama-3.2-3b-instruct',
  CLOUDFLARE_EMBEDDING_MODEL: '@cf/baai/bge-large-en-v1.5',
}[k]);

describe('CloudflareAiService', () => {
  let service: CloudflareAiService;
  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [CloudflareAiService, { provide: ConfigService, useValue: { getOrThrow: cfg, get: cfg } }],
    }).compile();
    service = mod.get(CloudflareAiService);
    global.fetch = jest.fn();
  });

  it('embeds text and returns 1024-d vectors, hitting the correct URL + auth header', async () => {
    const vec = Array.from({ length: 1024 }, () => 0.01);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true, json: async () => ({ success: true, result: { data: [vec] } }),
    });
    const out = await service.embed(['hello']);
    expect(out[0]).toHaveLength(1024);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.cloudflare.com/client/v4/accounts/acc123/ai/run/@cf/baai/bge-large-en-v1.5');
    expect(init.headers.Authorization).toBe('Bearer tok456');
  });

  it('chats and returns the response text', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true, json: async () => ({ success: true, result: { response: 'Hi there' } }),
    });
    const out = await service.chat([{ role: 'user', content: 'hi' }]);
    expect(out.text).toBe('Hi there');
  });

  it('throws when Cloudflare returns success:false', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true, json: async () => ({ success: false, errors: [{ message: 'bad token' }] }),
    });
    await expect(service.embed(['x'])).rejects.toThrow(/bad token/);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL.**

- [ ] **Step 3: Implement `cloudflare-ai.service.ts`** — a single private `run(modelId, body)` helper builds the URL from `CLOUDFLARE_ACCOUNT_ID`, sets `Authorization: Bearer`, posts JSON, throws `BadGatewayException` on `!ok` or `success:false` (surfacing `errors[].message`). `embed` posts `{ text: texts }` and maps `result.data`. `chat` posts `{ messages, max_tokens, temperature }` and returns `{ text: result.response }`.

```ts
import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage, TokenUsage } from './types';

@Injectable()
export class CloudflareAiService {
  constructor(private readonly config: ConfigService) {}
  private get base() {
    const acc = this.config.getOrThrow<string>('CLOUDFLARE_ACCOUNT_ID');
    return `https://api.cloudflare.com/client/v4/accounts/${acc}/ai/run`;
  }
  private async run<T>(modelId: string, body: unknown): Promise<T> {
    const token = this.config.getOrThrow<string>('CLOUDFLARE_API_TOKEN');
    const res = await fetch(`${this.base}/${modelId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new BadGatewayException(`Cloudflare AI HTTP ${res.status}`);
    const json: any = await res.json();
    if (!json.success) throw new BadGatewayException(json.errors?.map((e: any) => e.message).join('; ') ?? 'Cloudflare AI error');
    return json.result as T;
  }
  async embed(texts: string[]): Promise<number[][]> {
    const model = this.config.getOrThrow<string>('CLOUDFLARE_EMBEDDING_MODEL');
    const result = await this.run<{ data: number[][] }>(model, { text: texts });
    return result.data;
  }
  async chat(messages: ChatMessage[], opts?: { maxTokens?: number; temperature?: number }): Promise<{ text: string; usage?: TokenUsage }> {
    const model = this.config.getOrThrow<string>('CLOUDFLARE_CHAT_MODEL');
    const result = await this.run<{ response: string; usage?: TokenUsage }>(model, {
      messages, max_tokens: opts?.maxTokens ?? 1024, temperature: opts?.temperature ?? 0.2,
    });
    return { text: result.response, usage: result.usage };
  }
}
```

- [ ] **Step 4: Create `types.ts`** (`ChatMessage`, `TokenUsage = { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }`) and `cloudflare-ai.module.ts` (provides + exports the service). Register `CloudflareAiModule` in `AppModule`.

- [ ] **Step 5: Run the tests, expect PASS.**

- [ ] **Step 6: Commit** `git commit -am "feat(cloudflare-ai): CF Workers AI embed+chat service with tests"`.

---

### Task 1.3: AuthModule + UsersModule (register / login / JWT guard)

**Files:**
- Create: `apps/backend/src/users/users.module.ts`, `users.service.ts`; `apps/backend/src/auth/auth.module.ts`, `auth.service.ts`, `auth.controller.ts`, `dto/register.dto.ts`, `dto/login.dto.ts`, `strategies/jwt.strategy.ts`, `guards/jwt-auth.guard.ts`, `decorators/current-user.decorator.ts`
- Test: `apps/backend/src/auth/auth.service.spec.ts`

**Interfaces:**
- Consumes: `User` entity (Task 1.1).
- Produces: `POST /api/auth/register` + `POST /api/auth/login` → `{ accessToken, user: { id, email } }`; `JwtAuthGuard`; `@CurrentUser()` param decorator yielding `{ userId, email }`; `UsersService.create/findByEmail/findById`.

- [ ] **Step 1: Write failing `auth.service.spec.ts`** — register hashes password + returns token; login rejects wrong password with `UnauthorizedException`; duplicate email throws `ConflictException`. Mock `UsersService` + `JwtService`.

- [ ] **Step 2: Run it, expect FAIL.**

- [ ] **Step 3: Implement `UsersService`** (`create({email, passwordHash})`, `findByEmail`, `findById`) over the `User` repository.

- [ ] **Step 4: Implement `AuthService`** — `register(dto)`: throw `ConflictException` if email exists, `bcrypt.hash(password, 10)`, persist, return `sign()`. `login(dto)`: load user, `bcrypt.compare`, throw `UnauthorizedException` on mismatch, return `sign()`. `private sign(user)` issues `jwtService.sign({ sub: user.id, email: user.email })`.

- [ ] **Step 5: DTOs** — `RegisterDto`/`LoginDto` with `@IsEmail()` + `@MinLength(8)`. `JwtStrategy` validates `JWT_SECRET`, maps payload → `{ userId: sub, email }`. `JwtAuthGuard extends AuthGuard('jwt')`. `@CurrentUser()` reads `req.user`.

- [ ] **Step 6: `AuthController`** wires `POST /auth/register` and `POST /auth/login`. Register `AuthModule` (imports `JwtModule.registerAsync` with `JWT_SECRET`, `expiresIn: '7d'`) and `UsersModule` in `AppModule`.

- [ ] **Step 7: Run tests, expect PASS.**

- [ ] **Step 8: Commit** `git commit -am "feat(auth): JWT register/login, guard, current-user decorator"`.

---

### Task 1.4: Token-aware chunking utility + tests

**Files:**
- Create: `apps/backend/src/embeddings/chunking.ts`
- Test: `apps/backend/src/embeddings/chunking.spec.ts`

**Interfaces:**
- Produces: `chunkText(text: string, opts?: { chunkTokens?: number; overlapTokens?: number }): { content: string; index: number; tokenCount: number }[]`. Defaults: `chunkTokens=850`, `overlapTokens=120` (within the 700–1000 / 100–150 constraint). Uses `js-tiktoken` `cl100k_base` to count/split tokens, decoding each window back to text.

- [ ] **Step 1: Write the failing test**

```ts
import { chunkText } from './chunking';
describe('chunkText', () => {
  it('returns a single chunk for short text', () => {
    const out = chunkText('hello world');
    expect(out).toHaveLength(1);
    expect(out[0].index).toBe(0);
    expect(out[0].content).toContain('hello world');
  });
  it('splits long text into overlapping windows with sequential indexes', () => {
    const long = Array.from({ length: 4000 }, (_, i) => `word${i}`).join(' ');
    const out = chunkText(long, { chunkTokens: 200, overlapTokens: 40 });
    expect(out.length).toBeGreaterThan(1);
    expect(out.map((c) => c.index)).toEqual(out.map((_, i) => i));
    expect(out.every((c) => c.tokenCount <= 200)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL.**

- [ ] **Step 3: Implement `chunking.ts`** — encode text once with `getEncoding('cl100k_base')`, slide a `chunkTokens` window advancing by `chunkTokens - overlapTokens`, `decode` each window, trim, and emit `{ content, index, tokenCount }`.

```ts
import { getEncoding } from 'js-tiktoken';
const enc = getEncoding('cl100k_base');
export function chunkText(text: string, opts?: { chunkTokens?: number; overlapTokens?: number }) {
  const chunkTokens = opts?.chunkTokens ?? 850;
  const overlap = opts?.overlapTokens ?? 120;
  const step = Math.max(1, chunkTokens - overlap);
  const tokens = enc.encode(text);
  const out: { content: string; index: number; tokenCount: number }[] = [];
  for (let start = 0, index = 0; start < tokens.length; start += step, index++) {
    const window = tokens.slice(start, start + chunkTokens);
    const content = enc.decode(window).trim();
    if (content) out.push({ content, index, tokenCount: window.length });
    if (start + chunkTokens >= tokens.length) break;
  }
  return out.length ? out : [{ content: text.trim(), index: 0, tokenCount: tokens.length }];
}
```

- [ ] **Step 4: Run tests, expect PASS.**

- [ ] **Step 5: Commit** `git commit -am "feat(embeddings): token-aware chunking util with tests"`.

---

### Task 1.5: EmbeddingsModule — embed + persist chunks

**Files:**
- Create: `apps/backend/src/embeddings/embeddings.module.ts`, `embeddings.service.ts`
- Test: `apps/backend/src/embeddings/embeddings.service.spec.ts`

**Interfaces:**
- Consumes: `chunkText` (1.4), `CloudflareAiService.embed` (1.2), `DocumentChunk` repo (1.1).
- Produces: `EmbeddingsService.processDocument(documentId: string, text: string, sourceFilename: string): Promise<number>` — chunks, embeds in batches, persists chunks with embeddings, returns chunk count.

- [ ] **Step 1: Write failing test** — given a fake text, `processDocument` calls `embed` with the chunk contents and saves N `DocumentChunk` rows with `documentId`, `chunkIndex`, `embedding.length === 1024`. Mock `CloudflareAiService` (returns 1024-d vectors) and the repo (`create`/`save`).

- [ ] **Step 2: Run it, expect FAIL.**

- [ ] **Step 3: Implement `EmbeddingsService.processDocument`** — `const chunks = chunkText(text)`; batch contents (e.g. 50 per Cloudflare call) through `embed`; build `DocumentChunk` rows pairing each chunk with its vector + `sourceFilename`; `save` them; return `chunks.length`. Guard: throw if any returned vector length ≠ 1024.

- [ ] **Step 4: Run tests, expect PASS.**

- [ ] **Step 5: Commit** `git commit -am "feat(embeddings): chunk→embed→persist pipeline with tests"`.

---

### Task 1.6: DocumentsModule — upload (txt/md), process, list, get, delete

**Files:**
- Create: `apps/backend/src/documents/documents.module.ts`, `documents.service.ts`, `documents.controller.ts`, `dto/upload-result.dto.ts`, `text-extraction.ts`
- Test: `apps/backend/src/documents/documents.service.spec.ts`

**Interfaces:**
- Consumes: `EmbeddingsService.processDocument` (1.5), `Document` repo (1.1), `JwtAuthGuard` + `@CurrentUser` (1.3).
- Produces endpoints (all JWT-guarded): `POST /api/documents/upload` (multipart, field `file`), `GET /api/documents`, `GET /api/documents/:id`, `DELETE /api/documents/:id`. `DocumentsService.create/processInline/findAllForUser/findOneForUser/remove`. `extractText(buffer, mimeType): Promise<string>` (M1 handles `text/plain` + `text/markdown`; throws `UnsupportedMediaTypeException` otherwise — PDF added in M2).

- [ ] **Step 1: Write failing `documents.service.spec.ts`** — `create` stores a `pending` document; `processInline` sets `processing` → calls `extractText` + `processDocument` → sets `ready`; on error sets `failed` + stores message; `findOneForUser` throws `NotFoundException` when the doc belongs to another user.

- [ ] **Step 2: Run it, expect FAIL.**

- [ ] **Step 3: Implement `text-extraction.ts`** — `extractText` for `text/plain`/`text/markdown` returns `buffer.toString('utf-8')`, then **sanitize**: strip control chars and collapse null bytes. PDF branch throws `UnsupportedMediaTypeException('PDF support arrives in M2')`.

- [ ] **Step 4: Implement `DocumentsService`** — `create(userId, file)` persists metadata `pending`; `processInline(doc, buffer)` wraps extract+embed in try/catch updating status; `findAllForUser`, `findOneForUser` (404 if `userId` mismatch), `remove` (cascade deletes chunks via FK).

- [ ] **Step 5: Implement `DocumentsController`** with file validation via `ParseFilePipe`:

```ts
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async upload(
  @CurrentUser() user: { userId: string },
  @UploadedFile(new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
      new FileTypeValidator({ fileType: /(text\/plain|text\/markdown|application\/octet-stream)/ }),
    ],
  })) file: Express.Multer.File,
) {
  const doc = await this.documents.create(user.userId, file);
  await this.documents.processInline(doc, file.buffer); // M1 inline; M4 moves to BullMQ
  return this.documents.findOneForUser(user.userId, doc.id);
}
```

(Note: `.md` files often arrive as `application/octet-stream`; `text-extraction` re-checks the extension to decide txt/md.)

- [ ] **Step 6: Register `DocumentsModule`** (imports `TypeOrmModule.forFeature([Document])` + `EmbeddingsModule`, applies `MulterModule` with memory storage). Add to `AppModule`.

- [ ] **Step 7: Run tests, expect PASS.**

- [ ] **Step 8: Commit** `git commit -am "feat(documents): upload/process/list/get/delete for txt+md"`.

---

### Task 1.7: RagModule + RagService — vector search + grounded answer

**Files:**
- Create: `apps/backend/src/rag/rag.module.ts`, `rag.service.ts`, `rag.controller.ts`, `dto/rag-query.dto.ts`, `prompts.ts`
- Test: `apps/backend/src/rag/rag.service.spec.ts`

**Interfaces:**
- Consumes: `CloudflareAiService.embed/chat` (1.2), `DocumentChunk` repo (1.1) for raw vector SQL, `SourceCitation`/`Confidence`/`RagQueryResponse` (shared).
- Produces: `RagService.retrieve(userId, query, topK=6): Promise<RetrievedChunk[]>` where `RetrievedChunk = { documentId, documentName, chunkIndex, content, score }`; `RagService.answer(userId, question, topK?): Promise<RagQueryResponse>`; `buildAnswerPrompt(context, question): ChatMessage[]`; `parseConfidence(text): Confidence`. Endpoint `POST /api/rag/query` (JWT) body `{ question, topK? }` → `RagQueryResponse`.

- [ ] **Step 1: Write failing `rag.service.spec.ts`**

```ts
// retrieve(): embeds the query then runs cosine SQL scoped to the user, returns mapped chunks.
// answer(): builds the exact prompt template, calls chat, returns { answer, citations, confidence }.
// answer(): when retrieve() returns [], returns a "not enough information" answer with confidence Low and no chat call.
```

Assert the SQL string passed to `repo.query` contains `embedding <=> ` and `ORDER BY` and `LIMIT`, and that `buildAnswerPrompt` output contains the verbatim system line "You are DevDocs AI Copilot, a careful technical assistant." Mock the repo `query` + `CloudflareAiService`.

- [ ] **Step 2: Run it, expect FAIL.**

- [ ] **Step 3: Implement `prompts.ts`** — `ANSWER_SYSTEM_PROMPT` (the exact template from Global Constraints with `{{retrieved_context}}`/`{{user_question}}` placeholders) and `buildAnswerPrompt(context, question)` returning `[{ role:'system', content: filledTemplate }, { role:'user', content: question }]`. `parseConfidence` scans the answer for `High|Medium|Low` (default `Medium`).

- [ ] **Step 4: Implement `RagService.retrieve`** — raw parameterized SQL joining chunks→documents, filtered by `documents.user_id`, ordered by cosine distance:

```ts
const rows = await this.chunkRepo.query(
  `SELECT c.document_id AS "documentId", d.filename AS "documentName",
          c.chunk_index AS "chunkIndex", c.content,
          1 - (c.embedding <=> $1::vector) AS score
     FROM document_chunks c
     JOIN documents d ON d.id = c.document_id
    WHERE d.user_id = $2 AND d.status = 'ready'
    ORDER BY c.embedding <=> $1::vector
    LIMIT $3`,
  [vectorTransformer.to(queryEmbedding), userId, topK],
);
```

`answer()` retrieves (default `topK=6`, clamp 5–8), and if empty returns the explicit "documents do not contain enough information" response (`confidence: Low`, `citations: []`) without calling chat. Otherwise format context as `[Doc: <name> #<chunkIndex>]\n<content>` blocks, call `chat`, map citations from retrieved chunks (snippet = first ~200 chars), and `parseConfidence`.

- [ ] **Step 5: `RagController`** `POST /rag/query` (JWT, `RagQueryDto { question: @IsString @MinLength(3); topK?: @IsInt @Min(5) @Max(8) }`). Register `RagModule` (`TypeOrmModule.forFeature([DocumentChunk])` + `CloudflareAiModule`) in `AppModule`.

- [ ] **Step 6: Run tests, expect PASS.**

- [ ] **Step 7: Commit** `git commit -am "feat(rag): pgvector retrieval + grounded answer with citations"`.

---

### Task 1.8: Frontend — auth store, router, API hooks, Login + Dashboard shells

**Files:**
- Create: `src/stores/auth.ts`, `src/stores/ui.ts`, `src/lib/queryClient.ts`, `src/router.tsx`, `src/api/auth.ts`, `src/components/EmptyState.tsx`, `src/components/LoadingState.tsx`, `src/pages/Login.tsx`, `src/pages/Dashboard.tsx`, `src/components/ProtectedRoute.tsx`
- Test: `src/api/auth.test.tsx`

**Interfaces:**
- Consumes: `api` axios (0.4), backend `/auth/*` (1.3).
- Produces: `useAuthStore` (`token`, `user`, `setAuth`, `logout`, persisted to localStorage); `useLogin()`/`useRegister()` React Query mutations; `<ProtectedRoute>` redirecting to `/login` when unauthenticated; route tree for all 7 pages (placeholders filled by later tasks); shared `EmptyState`/`LoadingState`.

- [ ] **Step 1: Write a failing test** for `useLogin` — mock `api.post` to resolve `{ accessToken, user }`, render a tiny component using the hook inside `QueryClientProvider`, assert the store receives the token after submit. (Vitest + Testing Library + `jsdom`.)

- [ ] **Step 2: Run it, expect FAIL.**

- [ ] **Step 3: Implement `stores/auth.ts`** with Zustand `persist`:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
interface AuthState {
  token: string | null; user: { id: string; email: string } | null;
  setAuth: (t: string, u: { id: string; email: string }) => void; logout: () => void;
}
export const useAuthStore = create<AuthState>()(persist((set) => ({
  token: null, user: null,
  setAuth: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
}), { name: 'devdocs-auth' }));
```

- [ ] **Step 4: Implement `api/auth.ts`** (`useLogin`, `useRegister` mutations calling `api.post('/auth/login'|'/auth/register')` and `setAuth` on success), `LoadingState`/`EmptyState` presentational components, `ProtectedRoute`, and `router.tsx` mapping `/login`, `/` (Dashboard), `/documents/upload`, `/documents`, `/chat`, `/agents/:runId`, `/settings`.

- [ ] **Step 5: Implement `Login.tsx`** — Tailwind card with email/password, toggle register/login, shows `LoadingState` while pending and error text on failure.

- [ ] **Step 6: Run the test, expect PASS;** manually verify register+login against the running backend.

- [ ] **Step 7: Commit** `git commit -am "feat(frontend): auth store, router, login + protected routes"`.

---

### Task 1.9: Frontend — FileUploader + Upload/List documents pages

**Files:**
- Create: `src/api/documents.ts`, `src/components/FileUploader.tsx`, `src/components/DocumentCard.tsx`, `src/pages/UploadDocuments.tsx`, `src/pages/DocumentsList.tsx`
- Test: `src/components/FileUploader.test.tsx`

**Interfaces:**
- Consumes: backend `/documents/*` (1.6).
- Produces: `useDocuments()` (list query), `useUploadDocument()` (multipart mutation invalidating the list), `useDeleteDocument()`; `<FileUploader onUploaded>` (drag/drop + click, client-side type/size guard mirroring the server's 10MB + txt/md), `<DocumentCard>` showing filename, status badge, chunk-ready state, delete button.

- [ ] **Step 1: Write a failing test** — render `<FileUploader>`, simulate selecting a 12MB file, assert it shows a "file too large" error and does not call the upload mutation.

- [ ] **Step 2: Run it, expect FAIL.**

- [ ] **Step 3: Implement `api/documents.ts`** hooks (FormData upload via `api.post('/documents/upload', form)`).

- [ ] **Step 4: Implement `FileUploader`** with the client guard, `DocumentCard`, `UploadDocuments` page (uploader + recently uploaded), `DocumentsList` page (grid of `DocumentCard`, `EmptyState` when none, `LoadingState` while fetching).

- [ ] **Step 5: Run the test, expect PASS;** manually upload a `.md` and confirm it appears as `ready`.

- [ ] **Step 6: Commit** `git commit -am "feat(frontend): file uploader + documents pages"`.

---

### Task 1.10: Frontend — ChatWindow + RAG query + SourceCitationList (M1 end-to-end)

**Files:**
- Create: `src/api/rag.ts`, `src/components/ChatWindow.tsx`, `src/components/MessageBubble.tsx`, `src/components/SourceCitationList.tsx`, `src/pages/Chat.tsx`
- Test: `src/components/ChatWindow.test.tsx`

**Interfaces:**
- Consumes: `POST /rag/query` (1.7) → `RagQueryResponse` (shared).
- Produces: `useRagQuery()` mutation; `<ChatWindow>` local message list (Zustand or `useState` for M1 — history persistence is M2), rendering `<MessageBubble>` per turn and `<SourceCitationList citations>` + confidence badge under each assistant answer.

- [ ] **Step 1: Write a failing test** — render `<ChatWindow>`, mock `useRagQuery` to resolve `{ answer, citations:[{documentName:'api.md', chunkIndex:2,...}], confidence:'High' }`, type a question, submit, assert the answer text, the citation `api.md #2`, and a `High` badge render.

- [ ] **Step 2: Run it, expect FAIL.**

- [ ] **Step 3: Implement `api/rag.ts`** (`useRagQuery` → `api.post('/rag/query', { question, topK })`), `MessageBubble` (role-styled), `SourceCitationList` (lists `documentName #chunkIndex` with score + snippet, `EmptyState` when none), `ChatWindow` (input, send, `LoadingState` while pending, append user + assistant messages), `Chat` page hosting it.

- [ ] **Step 4: Run the test, expect PASS.**

- [ ] **Step 5: Full M1 manual verification** (see Verification section).

- [ ] **Step 6: Commit** `git commit -am "feat(frontend): chat window + RAG answer with citations (M1 complete)"`.

---

## Milestone 2 — PDF, Chat History, Citations, Document Management

### Task 2.0: Frontend visual system refresh (production-grade app shell)

**Files:**
- Create: `apps/frontend/src/components/AppShell.tsx`, `apps/frontend/src/components/StatusBadge.tsx`, `apps/frontend/src/components/SourceRail.tsx`
- Modify: `apps/frontend/src/index.css`, `tailwind.config.ts`, `src/router.tsx`, `src/pages/Dashboard.tsx`, `src/pages/Login.tsx`, `src/pages/UploadDocuments.tsx`, `src/pages/DocumentsList.tsx`, `src/pages/Chat.tsx`, `src/components/DocumentCard.tsx`, `src/components/ChatWindow.tsx`, `src/components/SourceCitationList.tsx`
- Test: `apps/frontend/src/components/AppShell.test.tsx`, update existing frontend tests only where visible text changes.

**Interfaces:**
- Produces: a reusable production-grade app shell and visual system matching **Frontend Experience Direction**. Existing functionality stays unchanged.

- [ ] **Step 1: Write failing visual contract tests** — render `AppShell` with nav items and assert active nav, main landmark, account action, and keyboard-visible links exist. Render `SourceRail` with citations and assert `documentName #chunkIndex`, score, snippet, and empty state render.
- [ ] **Step 2: Run frontend tests, expect FAIL.**
- [ ] **Step 3: Implement design tokens** in Tailwind/CSS: palette from Frontend Experience Direction, compact spacing scale, 8px max radius, status badge colors, focus rings, app background, panel and line colors. Avoid gradients, blobs, nested cards, and oversized hero layout.
- [ ] **Step 4: Implement `AppShell`** with desktop nav rail, mobile top bar, active route styling, user action, and constrained workspace. Rewire protected pages through it; keep `/login` outside shell.
- [ ] **Step 5: Implement `StatusBadge` and `SourceRail`** and reuse them in document cards, chat citations, agent run details later, and metrics later. The source rail is the signature interaction: right rail on desktop, collapsible section/drawer on mobile.
- [ ] **Step 6: Polish existing M1 pages** — Login, Dashboard, UploadDocuments, DocumentsList, and Chat should feel like one product: dense lists, clear empty/loading/error states, production copy, no marketing hero cards.
- [ ] **Step 7: Run frontend tests/build, expect PASS.** Use browser screenshot verification on desktop and mobile if a local browser tool is available; otherwise document that visual verification remains manual.
- [ ] **Step 8: Commit** `git commit -am "feat(frontend): production app shell and visual system"`.

---

### Task 2.1: PDF text extraction

**Files:**
- Modify: `apps/backend/src/documents/text-extraction.ts`, `apps/backend/src/documents/documents.controller.ts` (allow `application/pdf`)
- Test: `apps/backend/src/documents/text-extraction.spec.ts`

**Interfaces:**
- Produces: `extractText(buffer, mimeType, filename)` now also handles `application/pdf` via `pdf-parse`, returning sanitized text; controller's `FileTypeValidator` regex extended to include `application/pdf`.

- [ ] **Step 1: Write failing test** — pass a small fixture PDF buffer, assert `extractText` returns text containing a known phrase; assert a corrupt buffer throws `UnprocessableEntityException`.
- [ ] **Step 2: Run it, expect FAIL.**
- [ ] **Step 3: Implement** the PDF branch (`const data = await pdfParse(buffer); return sanitize(data.text)`), wrap parse errors in `UnprocessableEntityException`. Extend the controller validator regex + the 10MB limit stays.
- [ ] **Step 4: Run tests, expect PASS.**
- [ ] **Step 5: Commit** `git commit -am "feat(documents): PDF text extraction via pdf-parse"`.

---

### Task 2.2: ChatModule — persisted sessions + messages

**Files:**
- Create: `apps/backend/src/chat/entities/chat-session.entity.ts`, `chat-message.entity.ts`; `chat.module.ts`, `chat.service.ts`, `chat.controller.ts`, `dto/create-session.dto.ts`, `dto/post-message.dto.ts`; migration `…-ChatTables.ts`
- Test: `apps/backend/src/chat/chat.service.spec.ts`

**Interfaces:**
- Consumes: `RagService.answer` (1.7), `JwtAuthGuard`/`@CurrentUser`.
- Produces: tables `chat_sessions` (`id`, `userId`, `title`, `createdAt`) + `chat_messages` (`id`, `sessionId`, `role`, `content`, `citations jsonb`, `confidence`, `createdAt`); endpoints `POST /api/chat/sessions`, `GET /api/chat/sessions`, `GET /api/chat/sessions/:id/messages`, `POST /api/chat/sessions/:id/messages` (persists the user message, calls `RagService.answer`, persists the assistant message with citations, returns it).

- [ ] **Step 1: Write failing `chat.service.spec.ts`** — `postMessage` persists a `user` row, calls `rag.answer`, persists an `assistant` row carrying `citations` + `confidence`, returns the assistant message; cross-user session access throws `NotFoundException`.
- [ ] **Step 2: Run it, expect FAIL.**
- [ ] **Step 3: Write the migration** for both tables (`citations` as `jsonb`, `role varchar`, `confidence varchar`).
- [ ] **Step 4: Implement entities + `ChatService`** (`createSession`, `listSessions`, `getMessages`, `postMessage`). `postMessage` auto-titles a new session from the first question (first ~60 chars).
- [ ] **Step 5: Implement `ChatController`** + register `ChatModule` (`forFeature([ChatSession, ChatMessage])` + `RagModule`).
- [ ] **Step 6: Run migration + tests, expect PASS.**
- [ ] **Step 7: Commit** `git commit -am "feat(chat): persisted sessions + messages over RAG"`.

---

### Task 2.3: Frontend — chat history (sessions sidebar + message replay) and richer citations

**Files:**
- Create: `src/api/chat.ts`; Modify: `src/pages/Chat.tsx`, `src/components/ChatWindow.tsx`
- Test: `src/api/chat.test.tsx`

**Interfaces:**
- Consumes: `/chat/*` (2.2).
- Produces: `useSessions()`, `useCreateSession()`, `useMessages(sessionId)`, `usePostMessage(sessionId)`; Chat page gains a sessions sidebar (new chat + select), and `ChatWindow` switches from local state to server-persisted messages keyed by session, replaying history with citations + confidence on load.

- [ ] **Step 1: Failing test** — mock `useMessages` to return two persisted messages and assert both render with their citations on mount.
- [ ] **Step 2: Run it, expect FAIL.**
- [ ] **Step 3: Implement** the chat hooks + rewire `ChatWindow`/`Chat` to sessions; "New chat" creates a session then navigates.
- [ ] **Step 4: Run test, expect PASS;** manual: create a session, ask, reload, see history.
- [ ] **Step 5: Commit** `git commit -am "feat(frontend): chat history sidebar + persisted messages"`.

---

### Task 2.4: Document management UX (status polling, re-index, delete)

**Files:**
- Modify: `src/pages/DocumentsList.tsx`, `src/components/DocumentCard.tsx`, `src/api/documents.ts`
- (Backend optional) Modify: `documents.controller.ts` — add `POST /documents/:id/reindex`.

**Interfaces:**
- Produces: list auto-refetches while any doc is `processing`/`pending` (React Query `refetchInterval`); `DocumentCard` shows status, chunk count (extend `GET /documents/:id` to include `chunkCount`), delete with confirm, optional re-index.

- [ ] **Step 1: Extend backend** `findOneForUser`/list to include `chunkCount` (count query) and add `reindex` (delete chunks, re-run `processInline`). Add a focused service test for `reindex` clearing old chunks.
- [ ] **Step 2: Run backend test, expect PASS.**
- [ ] **Step 3: Implement** polling + chunk count + delete-confirm + re-index button in the UI.
- [ ] **Step 4: Manual verification;** **Commit** `git commit -am "feat(documents): status polling, chunk count, reindex, delete UX (M2 complete)"`.

---

## Milestone 2.5 — Premium Dashboard Redesign

This milestone implements the `DESIGN.md` direction across the existing M1/M2 frontend before starting the agentic backend work. It is intentionally UI-focused: no new backend domain behavior unless a page needs an already-planned read endpoint. Keep functionality stable while upgrading visual quality.

### Task 2.5: Theme tokens + premium shell foundation

**Files:**
- Modify: `apps/frontend/tailwind.config.ts`, `apps/frontend/src/index.css`, `apps/frontend/src/components/AppShell.tsx`, `apps/frontend/src/components/AppShell.test.tsx`
- Optional create: `apps/frontend/src/stores/ui.ts` for theme preference.

**Interfaces:**
- Produces: dark-default theme tokens, light theme overrides, refined app shell, premium sidebar/header primitives, and accessible theme toggle plumbing.

- [ ] **Step 1: Write failing shell/theme tests** — assert sidebar includes DevDocs AI wordmark, grouped nav links (`Overview`, `Documents`, `Upload`, `Chat`, `Agents`, `Sessions`, `Settings`), active state, account/logout action, and a theme toggle.
- [ ] **Step 2: Implement CSS/Tailwind tokens** from `DESIGN.md`: dark/light surfaces, text, borders, accent colors, semantic colors, radius scale, button/panel/input classes, transitions, and focus rings.
- [ ] **Step 3: Redesign `AppShell`** — 260-280px premium sidebar, mobile top bar, grouped navigation, compact user profile, logout pinned bottom, refined page header support (`eyebrow`, `description`, `actions`).
- [ ] **Step 4: Run frontend tests/build.** Use browser screenshots if available; otherwise mark visual browser verification manual.
- [ ] **Step 5: Commit** `git commit -am "feat(frontend): premium theme tokens and app shell"`.

### Task 2.6: Dashboard premium overview

**Files:**
- Modify: `apps/frontend/src/pages/Dashboard.tsx`
- Optional modify: `apps/frontend/src/api/documents.ts`, `apps/frontend/src/api/chat.ts` only if existing hooks already provide useful counts.

**Interfaces:**
- Produces: dashboard hero summary, quick actions, stats cards, recent activity placeholders, and intentional empty state using current APIs.

- [ ] **Step 1: Add/adjust a focused frontend test** for visible quick actions and stats labels.
- [ ] **Step 2: Implement hero panel** with title, supporting copy, primary `Upload documents` CTA and secondary `Start chat` CTA.
- [ ] **Step 3: Implement stats/quick action cards** for documents, chat sessions, agent runs placeholder, and last activity/storage placeholder. Use real document/session counts where already available; placeholder only where backend does not exist yet.
- [ ] **Step 4: Run frontend tests/build; commit** `git commit -am "feat(frontend): premium dashboard overview"`.

### Task 2.7: Documents + upload premium workflows

**Files:**
- Modify: `apps/frontend/src/pages/DocumentsList.tsx`, `apps/frontend/src/pages/UploadDocuments.tsx`, `apps/frontend/src/components/DocumentCard.tsx`, `apps/frontend/src/components/FileUploader.tsx`, `apps/frontend/src/components/EmptyState.tsx`, `apps/frontend/src/components/LoadingState.tsx`

**Interfaces:**
- Produces: search/filter/sort controls, polished document cards/table-like scanability, refined upload drop zone, upload queue/recent upload presentation where current data supports it.

- [ ] **Step 1: Add focused frontend tests** for document search/filter UI and PDF/txt/md upload support copy.
- [ ] **Step 2: Implement document page controls** — search input, status filter, sort dropdown, compact metadata, status/chunk badges, action row.
- [ ] **Step 3: Implement premium upload state** — large drop zone, support text, pending/progress visual state, recent uploads link/section using existing document list.
- [ ] **Step 4: Run frontend tests/build; commit** `git commit -am "feat(frontend): premium documents and upload workflows"`.

### Task 2.8: Chat premium workspace

**Files:**
- Modify: `apps/frontend/src/pages/Chat.tsx`, `apps/frontend/src/components/ChatWindow.tsx`, `apps/frontend/src/components/MessageBubble.tsx`, `apps/frontend/src/components/SourceCitationList.tsx`, `apps/frontend/src/components/SourceRail.tsx`

**Interfaces:**
- Produces: premium AI chat layout with conversation list, RAG mode badge, suggested prompts, refined input dock, readable message spacing, citation chips/rail, and empty/loading/error states.

- [ ] **Step 1: Add focused frontend test** asserting suggested prompts and persisted citations render.
- [ ] **Step 2: Redesign chat workspace** with session sidebar, main chat panel, source/citation area, mode badge, and prompt suggestions.
- [ ] **Step 3: Keep server-persisted message behavior unchanged.**
- [ ] **Step 4: Run frontend tests/build; commit** `git commit -am "feat(frontend): premium chat workspace"`.

### Task 2.9: Agents and settings visual placeholders

**Files:**
- Modify: `apps/frontend/src/router.tsx`
- Create or modify: `apps/frontend/src/pages/AgentRunDetails.tsx`, `apps/frontend/src/pages/Settings.tsx`

**Interfaces:**
- Produces: polished placeholder pages matching `DESIGN.md` for Agents/Sessions/Settings so navigation feels complete before M3 endpoints exist.

- [ ] **Step 1: Add focused frontend test** for Settings theme/model/config sections and Agent timeline placeholder labels.
- [ ] **Step 2: Implement Settings page sections** — profile, theme preference, Cloudflare AI config status, retrieval/model placeholders.
- [ ] **Step 3: Implement Agents/Sessions placeholders** — timeline-style layout, status badges, empty state that explains agent runs arrive in M3.
- [ ] **Step 4: Run frontend tests/build; commit** `git commit -am "feat(frontend): premium agents and settings placeholders"`.

---

## Milestone 3 — LangGraph Agentic Loop

### Task 3.1: agent_runs + agent_steps schema

**Files:**
- Create: `apps/backend/src/agents/entities/agent-run.entity.ts`, `agent-step.entity.ts`; migration `…-AgentTables.ts`

**Interfaces:**
- Produces: tables `agent_runs` (`id`, `userId`, `sessionId nullable`, `question`, `finalAnswer`, `confidence`, `status`, `retryCount`, `createdAt`) + `agent_steps` (`id`, `runId`, `name`, `input jsonb`, `output jsonb`, `latencyMs`, `order`, `createdAt`); entities `AgentRun`, `AgentStep`.

- [ ] **Step 1: Write the migration** for both tables (`name varchar` from `AgentStepName`, `input`/`output` `jsonb`).
- [ ] **Step 2: Create entities + relations** (`AgentRun` 1—N `AgentStep`).
- [ ] **Step 3: Run migration;** verify tables. **Commit** `git commit -am "feat(agents): agent_runs + agent_steps schema"`.

---

### Task 3.2: Agent state + nodes (classify, rewrite, retrieve, evaluate, retry, generate, verify, final)

**Files:**
- Create: `apps/backend/src/agents/graph/state.ts`, `nodes.ts`, `agent-prompts.ts`
- Test: `apps/backend/src/agents/graph/nodes.spec.ts`

**Interfaces:**
- Consumes: `CloudflareAiService` (1.2), `RagService.retrieve` (1.7), `AgentStepName`/`Confidence`/`SourceCitation` (shared).
- Produces: `AgentState` annotation (channels: `userId`, `question`, `classification`, `searchQuery`, `retrieved: RetrievedChunk[]`, `contextSufficient: boolean`, `retryCount: number`, `answer`, `citations: SourceCitation[]`, `confidence`, `verified: boolean`, `steps: StepLog[]`); node factory `createNodes(deps: { ai: CloudflareAiService; rag: RagService })` returning the 8 async node fns, each appending a `StepLog { name, input, output, latencyMs }` to `state.steps`.

- [ ] **Step 1: Write failing `nodes.spec.ts`** — for each node, given a seeded partial state + mocked `ai`/`rag`, assert it returns the expected partial update and pushes exactly one `StepLog` with the right `name`. Key cases: `classifyQuestion` maps model output to one of `simple|document|technical|multi-step`; `rewriteQuery` sets `searchQuery`; `retrieveContext` calls `rag.retrieve(userId, searchQuery)` and stores chunks; `evaluateContext` sets `contextSufficient=false` when chunks are empty/low-score; `retryRetrieval` increments `retryCount` and rewrites the query; `generateAnswer` builds the grounded prompt + sets `answer`+`citations`; `verifyAnswer` sets `verified` + adjusts `confidence`; `finalResponse` passes through.
- [ ] **Step 2: Run it, expect FAIL.**
- [ ] **Step 3: Implement `state.ts`** using `Annotation.Root`:

```ts
import { Annotation } from '@langchain/langgraph';
export const AgentState = Annotation.Root({
  userId: Annotation<string>(),
  question: Annotation<string>(),
  classification: Annotation<string>(),
  searchQuery: Annotation<string>(),
  retrieved: Annotation<RetrievedChunk[]>({ reducer: (_, n) => n, default: () => [] }),
  contextSufficient: Annotation<boolean>({ reducer: (_, n) => n, default: () => false }),
  retryCount: Annotation<number>({ reducer: (_, n) => n, default: () => 0 }),
  answer: Annotation<string>(),
  citations: Annotation<SourceCitation[]>({ reducer: (_, n) => n, default: () => [] }),
  confidence: Annotation<Confidence>(),
  verified: Annotation<boolean>({ reducer: (_, n) => n, default: () => false }),
  steps: Annotation<StepLog[]>({ reducer: (a, n) => a.concat(n), default: () => [] }),
});
```

- [ ] **Step 4: Implement `agent-prompts.ts`** — classifier, rewriter, evaluator (returns `SUFFICIENT`/`INSUFFICIENT`), verifier (returns `GROUNDED`/`UNGROUNDED` + reason) system prompts; the grounded answer prompt reuses `buildAnswerPrompt` from `rag/prompts.ts` (DRY — do **not** duplicate the template).
- [ ] **Step 5: Implement `nodes.ts`** — a `withStep(name, fn)` wrapper times the node and returns `{ ...update, steps: [log] }`. Each node calls `ai.chat`/`rag.retrieve`. `evaluateContext` uses a cheap heuristic first (no chunks or top score < threshold → insufficient) before optionally asking the model. The agent-rule enforcement (no invented facts, cite doc+chunk, state when insufficient) lives in these prompts.
- [ ] **Step 6: Run tests, expect PASS.**
- [ ] **Step 7: Commit** `git commit -am "feat(agents): langgraph state + 8 nodes with step logging"`.

---

### Task 3.3: Build the graph + AgentsService (run + persist) + tests

**Files:**
- Create: `apps/backend/src/agents/graph/build-graph.ts`, `apps/backend/src/agents/agents.service.ts`, `agents.module.ts`
- Test: `apps/backend/src/agents/agents.service.spec.ts`

**Interfaces:**
- Consumes: nodes/state (3.2), `AgentRun`/`AgentStep` repos (3.1).
- Produces: `buildAgentGraph(deps)` → compiled graph with conditional edges (retry loop bounded at 2); `AgentsService.run(userId, question, sessionId?): Promise<{ runId, answer, citations, confidence, steps }>` which invokes the graph then persists `AgentRun` + ordered `AgentStep` rows.

- [ ] **Step 1: Write failing `agents.service.spec.ts`** — with mocked `ai` returning weak-then-strong context, assert: the graph retries retrieval, `retryCount<=2`, a final grounded answer is produced, and `AgentRun` + N `AgentStep` rows are saved in order. Also assert that when context never improves, it still terminates with a "not enough information" answer at confidence `Low`.
- [ ] **Step 2: Run it, expect FAIL.**
- [ ] **Step 3: Implement `build-graph.ts`**

```ts
import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentState } from './state';
export function buildAgentGraph(deps) {
  const n = createNodes(deps);
  const g = new StateGraph(AgentState)
    .addNode('classifyQuestion', n.classifyQuestion)
    .addNode('rewriteQuery', n.rewriteQuery)
    .addNode('retrieveContext', n.retrieveContext)
    .addNode('evaluateContext', n.evaluateContext)
    .addNode('retryRetrieval', n.retryRetrieval)
    .addNode('generateAnswer', n.generateAnswer)
    .addNode('verifyAnswer', n.verifyAnswer)
    .addNode('finalResponse', n.finalResponse)
    .addEdge(START, 'classifyQuestion')
    .addEdge('classifyQuestion', 'rewriteQuery')
    .addEdge('rewriteQuery', 'retrieveContext')
    .addEdge('retrieveContext', 'evaluateContext')
    .addConditionalEdges('evaluateContext', (s) =>
      s.contextSufficient || s.retryCount >= 2 ? 'generateAnswer' : 'retryRetrieval',
      { generateAnswer: 'generateAnswer', retryRetrieval: 'retryRetrieval' })
    .addEdge('retryRetrieval', 'retrieveContext')
    .addEdge('generateAnswer', 'verifyAnswer')
    .addConditionalEdges('verifyAnswer', (s) =>
      s.verified || s.retryCount >= 2 ? 'finalResponse' : 'retryRetrieval',
      { finalResponse: 'finalResponse', retryRetrieval: 'retryRetrieval' })
    .addEdge('finalResponse', END);
  return g.compile();
}
```

- [ ] **Step 4: Implement `AgentsService.run`** — `graph.invoke({ userId, question })`, then persist `AgentRun` (status `completed`, `retryCount`, `finalAnswer`, `confidence`) and map `state.steps` → `AgentStep` rows with `order`. Wrap in try/catch → `failed` run on error.
- [ ] **Step 5: Register `AgentsModule`** (`forFeature([AgentRun, AgentStep])` + `CloudflareAiModule` + `RagModule`).
- [ ] **Step 6: Run tests, expect PASS.**
- [ ] **Step 7: Commit** `git commit -am "feat(agents): compiled langgraph + persisted agent runs/steps"`.

---

### Task 3.4: agents/query endpoint + agent run retrieval

**Files:**
- Create: `apps/backend/src/agents/agents.controller.ts`, `dto/agent-query.dto.ts`

**Interfaces:**
- Produces: `POST /api/agents/query` (JWT) body `{ question, sessionId? }` → `{ runId, answer, citations, confidence, steps }`; `GET /api/agents/runs/:id` → run + ordered steps (for the details page).

- [ ] **Step 1: Implement controller** delegating to `AgentsService.run` + a `getRun(userId, id)` (404 if not owner). Add a service test for owner-scoped `getRun`.
- [ ] **Step 2: Run test, expect PASS.**
- [ ] **Step 3: Commit** `git commit -am "feat(agents): /agents/query + run details endpoints"`.

---

### Task 3.5: Frontend — agent mode toggle, AgentStepTimeline, Agent run details page

**Files:**
- Create: `src/api/agents.ts`, `src/components/AgentStepTimeline.tsx`, `src/pages/AgentRunDetails.tsx`; Modify: `src/components/ChatWindow.tsx`, `src/pages/Chat.tsx`
- Test: `src/components/AgentStepTimeline.test.tsx`

**Interfaces:**
- Consumes: `/agents/query` + `/agents/runs/:id` (3.4).
- Produces: `useAgentQuery()`, `useAgentRun(id)`; a chat "Agent mode" toggle routing the question to `/agents/query`; `<AgentStepTimeline steps>` rendering each node (name, latency, expandable input/output, retry markers); Agent run details page at `/agents/:runId`. Assistant answers in agent mode link to their run details.

- [ ] **Step 1: Failing test** — render `<AgentStepTimeline>` with a fixture of 8 steps incl. a retry, assert all node names render in order and the retry is visually flagged.
- [ ] **Step 2: Run it, expect FAIL.**
- [ ] **Step 3: Implement** the hooks, timeline, details page, and the chat toggle (Zustand `ui` store flag).
- [ ] **Step 4: Run test, expect PASS;** manual: ask in agent mode, open run details, see all 8 steps (M3 complete).
- [ ] **Step 5: Commit** `git commit -am "feat(frontend): agent mode + step timeline + run details (M3 complete)"`.

---

## Milestone 4 — Production Hardening

### Task 4.1: Move document processing to a BullMQ queue

**Files:**
- Create: `apps/backend/src/documents/documents.processor.ts`, `documents.queue.ts`; Modify: `documents.module.ts`, `documents.controller.ts`, `app.module.ts`
- Test: `apps/backend/src/documents/documents.processor.spec.ts`

**Interfaces:**
- Consumes: `EmbeddingsService.processDocument`, `REDIS_URL`.
- Produces: `BullModule.forRoot` (Redis from `REDIS_URL`) + queue `document-processing`; upload now enqueues a job and returns the `pending` doc immediately; `DocumentsProcessor` (`@Processor('document-processing')`) extracts+embeds and updates status; failures set `failed` + record error.

- [ ] **Step 1: Failing processor test** — a job processes a doc to `ready` on success and `failed` on error (mock `EmbeddingsService`).
- [ ] **Step 2: Run it, expect FAIL.**
- [ ] **Step 3: Implement** `BullModule` registration, the processor, and swap the controller's inline `processInline` for `queue.add('process', { documentId, ... })`. File buffer is persisted to local storage (`uploads/`) so the worker can read it (path stored on the document; abstracted behind a `StorageService` so S3/R2 can replace it later).
- [ ] **Step 4: Run test, expect PASS;** manual: upload, observe `processing` → `ready` via polling.
- [ ] **Step 5: Commit** `git commit -am "feat(documents): background processing via BullMQ + local storage abstraction"`.

---

### Task 4.2: Cost + token usage tracking

**Files:**
- Create: `apps/backend/src/telemetry/entities/ai-usage.entity.ts`, `telemetry.module.ts`, `usage.service.ts`; migration `…-AiUsage.ts`; Modify: `cloudflare-ai.service.ts` (emit usage), `agents.service.ts`/`rag.service.ts` (tag calls).
- Test: `apps/backend/src/telemetry/usage.service.spec.ts`

**Interfaces:**
- Produces: table `ai_usage` (`id`, `userId`, `model`, `operation` (`embed`|`chat`), `promptTokens`, `completionTokens`, `totalTokens`, `estimatedCostUsd`, `createdAt`); `UsageService.record(entry)`; `CloudflareAiService` accepts an optional `context { userId, operation }` and records usage after each call. Cost estimated from a per-model rate table (configurable constant).

- [ ] **Step 1: Failing test** — `record` persists a row and computes `estimatedCostUsd` from tokens × rate.
- [ ] **Step 2: Run it, expect FAIL.**
- [ ] **Step 3: Implement** entity + migration + service + wire a usage callback through `CloudflareAiService` (keep the service decoupled via an injected optional `UsageRecorder` interface to avoid a circular dep).
- [ ] **Step 4: Run test, expect PASS.**
- [ ] **Step 5: Commit** `git commit -am "feat(telemetry): per-call token usage + cost tracking"`.

---

### Task 4.3: Request logging interceptor

**Files:**
- Create: `apps/backend/src/common/interceptors/request-log.interceptor.ts`, `apps/backend/src/telemetry/entities/request-log.entity.ts`; migration; Modify: `app.module.ts` (global interceptor).
- Test: `request-log.interceptor.spec.ts`

**Interfaces:**
- Produces: table `request_logs` (`id`, `userId nullable`, `method`, `path`, `statusCode`, `latencyMs`, `createdAt`); a global `RequestLogInterceptor` recording method/path/status/latency per request (skips health checks).

- [ ] **Step 1: Failing test** — interceptor records a row with latency for a handled request.
- [ ] **Step 2–4: Implement, run (PASS), commit** `git commit -am "feat(telemetry): global request logging interceptor"`.

---

### Task 4.4: Rate limiting on chat + agent endpoints

**Files:**
- Modify: `app.module.ts` (`ThrottlerModule.forRoot`), `chat.controller.ts`, `agents.controller.ts`, `rag.controller.ts` (`@Throttle`), add global `ThrottlerGuard`.
- Test: `apps/backend/test/throttle.e2e-spec.ts`

**Interfaces:**
- Produces: per-user/IP rate limits (e.g. 20 req/min) on `/rag/query`, `/chat/sessions/:id/messages`, `/agents/query`; returns `429` past the limit.

- [ ] **Step 1: Failing e2e** — hammering `/rag/query` past the limit returns `429`.
- [ ] **Step 2: Run it, expect FAIL.**
- [ ] **Step 3: Implement** `ThrottlerModule` + `@Throttle` on the three controllers + register `ThrottlerGuard` as a global `APP_GUARD`.
- [ ] **Step 4: Run e2e, expect PASS;** **Commit** `git commit -am "feat(security): rate limiting on chat/rag/agent endpoints"`.

---

### Task 4.5: Evaluation dashboard

**Files:**
- Create: `apps/backend/src/telemetry/telemetry.controller.ts` (metrics endpoint); `src/api/metrics.ts`, `src/pages/Settings.tsx` (or a dedicated EvalDashboard section), `src/components/ModelSettingsForm.tsx`.

**Interfaces:**
- Produces: `GET /api/telemetry/metrics` (JWT) → `{ totalDocuments, totalChunks, totalQueries, avgRetrievalScore, totalCostUsd, agentRunCount, avgAgentSteps, lowConfidenceRate }`; a frontend dashboard rendering these cards + a `ModelSettingsForm` (read-only display of active models + adjustable `topK`/temperature stored client-side and sent per query).

- [ ] **Step 1: Implement** the metrics aggregation service + controller; add a focused service test asserting the aggregation SQL returns the expected shape against seeded rows.
- [ ] **Step 2: Run test, expect PASS.**
- [ ] **Step 3: Implement** the frontend metrics hooks, dashboard cards, and `ModelSettingsForm` (Settings page).
- [ ] **Step 4: Manual verification;** **Commit** `git commit -am "feat(eval): metrics endpoint + evaluation dashboard + settings"`.

---

### Task 4.6: Deployment guide

**Files:**
- Create: `README.md`, `docs/DEPLOYMENT.md`, `apps/backend/Dockerfile`, `apps/frontend/Dockerfile`, `.env.example` (final)

**Interfaces:**
- Produces: a runnable README (local dev: install/start local Postgres+pgvector and Redis, `bun install`, `bun run migration:run`, `bun run dev:backend`, `bun run dev:frontend`) and `DEPLOYMENT.md` covering managed Postgres+pgvector, Redis, env/secrets, building both Docker images, running migrations on deploy, and swapping local storage for S3/R2.

- [ ] **Step 1: Write `README.md`** (setup, env table, scripts, architecture diagram in text).
- [ ] **Step 2: Write `docs/DEPLOYMENT.md`** + both Dockerfiles (backend: Bun base image running compiled Nest; frontend: build then serve static via nginx).
- [ ] **Step 3: Commit** `git commit -am "docs: README + deployment guide + Dockerfiles (M4 complete)"`.

---

## Verification (end-to-end)

**Infra:** Docker Postgres 18 with pgvector running on host port `5433` (`postgres`/`postgres`, db `devdocs`); pgAdmin on `localhost:5050`; Redis local/container on `localhost:6379` from M4 onward. `bun install` at root. `bun --cwd apps/backend run migration:run` applies all migrations (verify `\d document_chunks` shows `embedding vector(1024)` and the HNSW index exists).

**Backend tests:** `bun --cwd apps/backend run test` — all green, including the three required suites: `cloudflare-ai.service.spec`, `rag.service.spec`, `agents.service.spec`.

**Frontend tests:** `bun --cwd apps/frontend run test` — all green.

**M1 manual flow:**
1. Start backend + frontend; open http://localhost:3000.
2. Register → land on Dashboard.
3. Upload a `.md` file (e.g. an API doc). Confirm it reaches `ready` with a chunk count > 0.
4. Open Chat, ask a question answerable from the doc. Confirm: a grounded answer, a source list citing `documentName #chunkIndex`, and a confidence badge.
5. Ask something not in the docs. Confirm the assistant explicitly says it lacks the information (confidence `Low`).

**M2:** Upload a PDF → `ready`. Verify chat history persists across reload; sessions list works; citations render from persisted messages.

**M2.5:** Toggle dark/light theme, verify shell/sidebar/header consistency, inspect dashboard/documents/upload/chat/settings pages on desktop and mobile, confirm active navigation, hover/focus states, readable contrast, and no text overlap.

**M3:** Toggle Agent mode, ask a question requiring retrieval. Open the run details page and confirm all 8 nodes appear in order with latencies; force a weak query and confirm `retryRetrieval` fires (≤2) and the timeline shows it.

**M4:** Upload a large doc and confirm it processes via the BullMQ worker (status transitions). Hit `/rag/query` repeatedly to trigger `429`. Open the eval dashboard and confirm cost/usage/metrics populate. Follow `README.md` from a clean clone to validate setup steps.

**Security checks:** Confirm no `CLOUDFLARE_*` value is referenced anywhere under `apps/frontend/`; confirm protected endpoints return `401` without a JWT; confirm oversized/unsupported uploads are rejected (`413`/`415`/`422`).

---

## Self-Review Notes

- **Spec coverage:** All 8 backend modules, 7 tables, all listed endpoints, all React pages/components, the 8 LangGraph nodes, the exact prompt template, chunk/overlap/topK/retry constraints, the four milestones, and every security requirement map to tasks above. Cross-app contracts live in `@devdocs/shared` to keep types consistent.
- **Type consistency:** `chunkText`, `CloudflareAiService.embed/chat`, `RagService.retrieve/answer`, `vectorTransformer`, `buildAnswerPrompt`, `AgentState`, `buildAgentGraph`, and `AgentsService.run` keep the same names where referenced across tasks. The answer prompt template is defined once in `rag/prompts.ts` and reused by the agent (DRY).
- **Deferred-by-design:** S3/R2 (storage abstraction stub now), streaming responses, and multi-tenant org support are intentionally out of scope (YAGNI) until requested.
