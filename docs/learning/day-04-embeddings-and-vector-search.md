# Day 4 - Embeddings And Vector Search

## Goal

Understand chunking, embeddings, pgvector storage, and similarity retrieval.

## Learn These Ideas

- Chunk: smaller piece of document text.
- Token: model-sized text unit; not always same as word.
- Embedding: number array representing text meaning.
- Vector search: compare embedding distance to find similar chunks.
- pgvector: Postgres extension for vector columns and similarity operators.

## Files To Open

- `apps/backend/src/embeddings/chunking.ts`
- `apps/backend/src/embeddings/embeddings.service.ts`
- `apps/backend/src/documents/entities/document-chunk.entity.ts`
- `apps/backend/src/database/transformers/vector.transformer.ts`
- `apps/backend/src/database/migrations/1700000000001-DocumentChunksVector.ts`
- `apps/backend/src/rag/rag.service.ts`
- `docker/postgres/init/01-extensions.sql`

## What To Trace

Embedding path:

```text
plain text -> chunkText -> batches of 50
-> CloudflareAiService.embed -> validate 1024 dimensions
-> save DocumentChunk rows with embedding vector
```

Retrieval path:

```text
question -> CloudflareAiService.embed
-> vectorTransformer.to(queryEmbedding)
-> SQL orders by c.embedding <=> query vector
-> return top chunks with similarity score
```

## Key Code Behavior

`RagService.retrieve` filters to:

- same user
- documents with `ready` status
- top 5 to 8 chunks after `clampTopK`

This protects user data and keeps prompts small.

## Commands

```powershell
bun --cwd apps/backend test -- chunking.spec.ts
bun --cwd apps/backend test -- embeddings.service.spec.ts
bun --cwd apps/backend test -- vector.transformer.spec.ts
bun --cwd apps/backend test -- rag.service.spec.ts
```

## Check Your Understanding

Answer:

1. Why chunk documents before embedding?
2. Why validate embedding dimension?
3. What does `<=>` do in pgvector query?
4. Why only retrieve from `ready` documents?

## Common Mistake

Embedding search does not compare exact words. It compares meaning through
vectors. Exact keyword match can fail while vector search still finds relevant
text.

