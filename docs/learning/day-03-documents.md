# Day 3 - Documents

## Goal

Understand upload, local storage, PDF/text extraction, BullMQ background
processing, and document statuses.

## Learn These Ideas

- Multipart upload: browser sends file bytes in `FormData`.
- Queue: controller returns fast while worker does slow processing.
- Status machine: `pending -> processing -> ready` or `failed`.
- Extraction: convert file bytes to plain text before embedding.

## Files To Open

- `apps/frontend/src/api/documents.ts`
- `apps/frontend/src/components/FileUploader.tsx`
- `apps/backend/src/documents/documents.controller.ts`
- `apps/backend/src/documents/documents.service.ts`
- `apps/backend/src/documents/storage.service.ts`
- `apps/backend/src/documents/documents.queue.ts`
- `apps/backend/src/documents/documents.processor.ts`
- `apps/backend/src/documents/text-extraction.ts`
- `apps/backend/src/documents/entities/document.entity.ts`

## What To Trace

```text
FileUploader -> useUploadDocument -> POST /api/documents/upload
-> DocumentsController.upload validates file
-> DocumentsService.create creates pending row
-> StorageService.save writes file
-> DocumentsQueueService.enqueueProcessing adds BullMQ job
-> DocumentsProcessor.process reads file
-> DocumentsService.processFromBuffer sets processing
-> extractText returns text
-> EmbeddingsService.processDocument stores chunks
-> document becomes ready or failed
```

## Commands

```powershell
bun --cwd apps/backend test -- documents.service.spec.ts
bun --cwd apps/backend test -- documents.processor.spec.ts
bun --cwd apps/backend test -- text-extraction.spec.ts
bun --cwd apps/frontend test -- FileUploader.test.tsx
```

## Check Your Understanding

Answer:

1. Why does upload return before embeddings finish?
2. Which field tells UI whether processing is done?
3. Where is failed error message stored?
4. Why does worker check `storagePath` before processing?

## Common Mistake

Do not mix `Document` and `DocumentChunk`.

- `Document` = file metadata and status.
- `DocumentChunk` = searchable text pieces with embeddings.

