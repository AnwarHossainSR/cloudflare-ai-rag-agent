# Scoped Document Chat Implementation Plan

> For agentic workers: implement task-by-task with TDD. Keep "all documents" as the default behavior. Empty document scope means all ready documents.

**Goal:** Let users chat with all documents or with selected specific documents, while keeping old chats and agent mode working.

**Architecture:** Store optional document scope on each chat session as `document_ids uuid[]`. RAG retrieval accepts optional `documentIds` and filters chunks only when the list is non-empty. Chat and agent mode read scope from the selected session so both use the same source boundary.

**Tech Stack:** NestJS, TypeORM, PostgreSQL/pgvector, React, React Query, Zustand, Tailwind, Vitest/Jest.

## Global Constraints

- Existing chats must keep working as all-document chats.
- Empty `documentIds` means all ready documents.
- Non-empty `documentIds` means retrieve only those ready documents owned by the user.
- No new dependencies.
- Add tests before implementation changes.

---

## Task 1: Backend Scoped Retrieval

**Files:**
- Modify: `apps/backend/src/rag/rag.service.ts`
- Modify: `apps/backend/src/rag/dto/rag-query.dto.ts`
- Modify: `apps/backend/src/rag/rag.controller.ts`
- Test: `apps/backend/src/rag/rag.service.spec.ts`

**Interfaces:**
- `RagService.retrieve(userId: string, query: string, topK?: number, documentIds?: string[]): Promise<RetrievedChunk[]>`
- `RagService.answer(userId: string, question: string, topK?: number, documentIds?: string[]): Promise<RagQueryResponse>`
- `RagQueryDto.documentIds?: string[]`

**Steps:**
- [ ] Add failing RAG tests for selected document filtering and default all-doc behavior.
- [ ] Run RAG test and confirm failure.
- [ ] Add optional `documentIds` filtering to SQL with `AND ($4::uuid[] IS NULL OR c.document_id = ANY($4::uuid[]))`.
- [ ] Add DTO/controller pass-through.
- [ ] Run RAG tests.

## Task 2: Backend Session Scope

**Files:**
- Create: `apps/backend/src/database/migrations/1700000000006-ChatSessionDocumentScope.ts`
- Modify: `apps/backend/src/chat/entities/chat-session.entity.ts`
- Modify: `apps/backend/src/chat/dto/create-session.dto.ts`
- Modify: `apps/backend/src/chat/chat.service.ts`
- Test: `apps/backend/src/chat/chat.service.spec.ts`

**Interfaces:**
- `ChatSession.documentIds: string[]`
- `CreateSessionDto.documentIds?: string[]`
- `ChatService.createSession(userId: string, title?: string, documentIds?: string[]): Promise<ChatSession>`
- `ChatService.postMessage(...)` passes `session.documentIds` to `RagService.answer`.

**Steps:**
- [ ] Add failing chat tests for session scope persistence and scoped RAG calls.
- [ ] Run chat test and confirm failure.
- [ ] Add migration and entity column.
- [ ] Add DTO validation.
- [ ] Pass `documentIds` from controller to service.
- [ ] Run chat tests.

## Task 3: Backend Agent Scope

**Files:**
- Modify: `apps/backend/src/agents/dto/agent-query.dto.ts`
- Modify: `apps/backend/src/agents/agents.service.ts`
- Modify: `apps/backend/src/agents/graph/state.ts`
- Modify: `apps/backend/src/agents/graph/nodes.ts`
- Test: `apps/backend/src/agents/agents.service.spec.ts`
- Test: `apps/backend/src/agents/graph/nodes.spec.ts`

**Interfaces:**
- `AgentQueryDto.documentIds?: string[]`
- `AgentsService.run(userId: string, question: string, sessionId?: string, documentIds?: string[])`
- `AgentState.documentIds: string[]`

**Steps:**
- [ ] Add failing node/service tests showing `retrieveContext` passes document scope.
- [ ] Run agent tests and confirm failure.
- [ ] Add `documentIds` to agent state and retrieve node input.
- [ ] Pass explicit scope from controller to service.
- [ ] Run agent tests.

## Task 4: Frontend Scoped Sessions

**Files:**
- Modify: `apps/frontend/src/api/chat.ts`
- Modify: `apps/frontend/src/api/agents.ts`
- Modify: `apps/frontend/src/components/ChatWindow.tsx`
- Modify: `apps/frontend/src/pages/Chat.tsx`
- Modify: `apps/frontend/src/components/DocumentCard.tsx`
- Test: `apps/frontend/src/components/ChatWindow.test.tsx`
- Test: `apps/frontend/src/components/DocumentCard.test.tsx`

**Interfaces:**
- `ChatSession.documentIds: string[]`
- `useCreateSession().mutateAsync({ documentIds?: string[] })`
- `usePostMessage(sessionId)` unchanged for content only, because scope is saved on session.
- `useAgentQuery({ question, sessionId, documentIds })`

**Steps:**
- [ ] Add failing frontend tests for creating a scoped chat and showing scope in chat.
- [ ] Run frontend tests and confirm failure.
- [ ] Add document scope types to frontend API.
- [ ] Add Chat page scope selector for all docs or selected ready docs.
- [ ] Add `Chat with this doc` action on ready document cards.
- [ ] Make ChatWindow display current scope and pass scope to agent mode.
- [ ] Run frontend tests and build.

## Task 5: Final Verification

**Commands:**
- `bun --cwd apps/backend test`
- `bun --cwd apps/frontend test`
- `bun run build:shared`
- `cd apps/backend; bun run build; cd ../..`
- `cd apps/frontend; bun run build; cd ../..`

**Manual smoke:**
- Create all-doc chat and ask a question.
- Create chat scoped to one ready document and confirm citations only show that document.
- Create agent run from scoped chat and confirm timeline retrieval count uses scope.

