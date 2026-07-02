# Day 6 - Agentic RAG

## Goal

Understand LangGraph agent flow: classify, rewrite, retrieve, evaluate, retry,
generate, verify, final. Learn how run steps become visible in UI.

## Learn These Ideas

- Graph: workflow made of nodes and edges.
- State: shared data carried between nodes.
- Node: one step that reads state and returns updates.
- Conditional edge: graph chooses next node from state.
- Run timeline: persisted trace for debugging and learning.

## Files To Open

- `apps/backend/src/agents/graph/state.ts`
- `apps/backend/src/agents/graph/build-graph.ts`
- `apps/backend/src/agents/graph/nodes.ts`
- `apps/backend/src/agents/graph/agent-prompts.ts`
- `apps/backend/src/agents/agents.service.ts`
- `apps/backend/src/agents/agents.controller.ts`
- `apps/backend/src/agents/entities/agent-run.entity.ts`
- `apps/backend/src/agents/entities/agent-step.entity.ts`
- `apps/frontend/src/api/agents.ts`
- `apps/frontend/src/pages/AgentRuns.tsx`
- `apps/frontend/src/pages/AgentRunDetails.tsx`
- `apps/frontend/src/components/AgentStepTimeline.tsx`

## What To Trace

```text
ChatWindow agent mode -> POST /api/agents/query
-> AgentsController.query
-> AgentsService.run
-> graph.invoke({ userId, question })
-> nodes append step logs
-> run saved as completed/failed
-> steps saved with order and latency
-> frontend shows runs and timeline
```

## Node Meaning

- `classifyQuestion`: decide if question is answerable/searchable.
- `rewriteQuery`: turn user question into better retrieval query.
- `retrieveContext`: call `RagService.retrieve`.
- `evaluateContext`: decide if retrieved context is enough.
- `retryRetrieval`: adjust query and try retrieval again.
- `generateAnswer`: build grounded final answer from context.
- `verifyAnswer`: check answer against context.
- `finalResponse`: produce final state for API response.

## Commands

```powershell
bun --cwd apps/backend test -- nodes.spec.ts
bun --cwd apps/backend test -- agents.service.spec.ts
```

## Check Your Understanding

Answer:

1. Why does agent need `evaluateContext` before answering?
2. What causes retry?
3. Where is each step saved?
4. Why is timeline useful when answer is wrong?

## Common Mistake

Agent mode is not a different database. It is a different workflow around the
same AI/RAG services.

