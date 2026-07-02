# Exercises

Do these after daily reading. Keep answers short. Goal: prove you understand
flow, not memorize every line.

## Exercise 1: Trace One Protected Request

Pick `GET /documents`.

1. Find frontend hook that calls it.
2. Find backend controller method.
3. Find guard that protects it.
4. Find service method that reads DB rows.
5. Write this in 5 lines:

```text
UI:
API hook:
Guard:
Service:
Returned data:
```

Check yourself with:

```powershell
rg -n "useDocuments|@Get\\(|findAllForUser|JwtAuthGuard" apps
```

## Exercise 2: Change Retrieval Count In Your Head

Do not edit first. Read `RagService.answer` and `clampTopK`.

Answer:

1. What happens if caller asks for `topK = 2`?
2. What happens if caller asks for `topK = 20`?
3. Why might app force a minimum and maximum?

Check file:

```powershell
rg -n "async answer|function clampTopK" apps/backend/src/rag/rag.service.ts
```

## Exercise 3: Add One Small Test

Practice target: `parseConfidence`.

Current test already checks High, Low, and default Medium. Add one new case for
`Confidence: Medium`, run only RAG tests, then revert if you are only practicing.

Command:

```powershell
bun --cwd apps/backend test -- rag.service.spec.ts
```

Expected learning: small pure functions are easiest test targets.

## Exercise 4: Explain One Agent Step

Pick `evaluateContext`.

Write:

```text
Input:
Decision:
Output:
What can go wrong:
Where UI shows it:
```

Use:

```powershell
rg -n "evaluateContext|AgentStepTimeline|AgentStepName" apps packages
```

## Exercise 5: Debug A Failed Document

Imagine a PDF upload becomes `failed`.

Trace these questions:

1. Did upload pass file validation?
2. Did queue job run?
3. Did `StorageService.read` find the file?
4. Did `extractText` throw?
5. Did Cloudflare return invalid embedding dimensions?
6. Where is error saved?

Start here:

```powershell
rg -n "processFromBuffer|extractText|invalid embedding|FAILED|error" apps/backend/src
```

## Exercise 6: Explain End-To-End RAG

Use one paragraph, no code:

```text
When user asks a question, the app ...
```

Must include these words correctly:

- embedding
- vector search
- chunk
- prompt
- citation
- confidence

## Exercise 7: Production Gap Check

Open [Feature Map](./feature-map.md). Pick one missing item.

Answer:

1. Why does app still work without it?
2. What risk remains?
3. Which file/module would likely change first?

