# Day 5 - RAG Chat

## Goal

Understand grounded answers, prompt building, citations, confidence, and saved
chat history.

## Learn These Ideas

- RAG: retrieval augmented generation.
- Grounding: answer must use retrieved document context.
- Citation: returned source chunk that supports answer.
- Confidence: model/text-derived label shown to user.
- Chat persistence: save both user and assistant messages.

## Files To Open

- `apps/backend/src/rag/rag.service.ts`
- `apps/backend/src/rag/prompts.ts`
- `apps/backend/src/rag/rag.utils.ts`
- `apps/backend/src/rag/rag.controller.ts`
- `apps/backend/src/chat/chat.service.ts`
- `apps/backend/src/chat/chat.controller.ts`
- `apps/frontend/src/api/chat.ts`
- `apps/frontend/src/components/ChatWindow.tsx`
- `apps/frontend/src/components/MessageBubble.tsx`
- `apps/frontend/src/components/SourceCitationList.tsx`

## What To Trace

RAG answer:

```text
question -> RagService.answer
-> retrieve relevant chunks
-> buildContextText
-> buildAnswerPrompt
-> CloudflareAiService.chat
-> parseConfidence
-> return answer + citations
```

Persisted chat:

```text
ChatWindow -> usePostMessage
-> ChatController.postMessage
-> ChatService.postMessage
-> save user message
-> RagService.answer
-> save assistant message with confidence/citations
-> frontend refetches messages
```

## Commands

```powershell
bun --cwd apps/backend test -- rag.service.spec.ts
bun --cwd apps/backend test -- chat.service.spec.ts
bun --cwd apps/frontend test -- ChatWindow.test.tsx
```

## Check Your Understanding

Answer:

1. What answer is returned when no chunks exist?
2. Where are citations created?
3. Why save assistant message after RAG returns?
4. What is difference between RAG mode and agent mode in `ChatWindow`?

## Common Mistake

RAG does not train the model. It adds retrieved document text into the prompt at
question time.

