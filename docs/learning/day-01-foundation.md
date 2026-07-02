# Day 1 - Foundation

## Goal

Understand project shape: monorepo, backend, frontend, shared package, env, and
how requests move through the app.

## Learn These Ideas

- Monorepo: one repo holds multiple apps/packages.
- NestJS module: backend feature boundary that groups controllers/services.
- Vite React app: frontend dev/build tool plus React UI.
- Shared types: one package prevents frontend/backend enum drift.
- Env config: secrets and URLs live outside code.

## Files To Open

- `package.json`
- `apps/backend/src/main.ts`
- `apps/backend/src/app.module.ts`
- `apps/frontend/src/main.tsx`
- `apps/frontend/src/router.tsx`
- `packages/shared/src/index.ts`
- `.env.example`

## What To Trace

1. Root `package.json` defines workspaces: backend, frontend, shared.
2. Backend starts in `main.ts`, creates Nest app, sets `/api`, enables CORS.
3. `AppModule` wires Config, TypeORM, BullMQ, Cloudflare AI, auth, docs, RAG,
   chat, agents.
4. Frontend routes live in `router.tsx`.
5. Shared enums define document status, chat roles, confidence, agent step names.

## Commands

```powershell
bun run build:shared
cd apps/backend; bun run build; cd ../..
cd apps/frontend; bun run build; cd ../..
```

## Check Your Understanding

Answer:

1. Why does backend set global prefix `/api`?
2. Why do frontend and backend both import from `@devdocs/shared`?
3. Which modules need database access?
4. Which modules call Cloudflare AI?

## 5-Line Summary Template

```text
This repo has:
Backend starts at:
Frontend routes live at:
Shared types solve:
Main external services are:
```

