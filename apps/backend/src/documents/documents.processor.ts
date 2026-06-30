import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DOCUMENT_PROCESSING_QUEUE } from './documents.constants';
import { DocumentProcessingJobData } from './documents.queue';
import { DocumentsService } from './documents.service';
import { StorageService } from './storage.service';

@Processor(DOCUMENT_PROCESSING_QUEUE)
export class DocumentsProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentsProcessor.name);

  constructor(
    private readonly documents: DocumentsService,
    private readonly storage: StorageService,
  ) {
    super();
  }

  async process(job: Job<DocumentProcessingJobData>): Promise<void> {
    const { documentId } = job.data;
    const doc = await this.documents.findById(documentId);
    if (!doc) {
      this.logger.warn(`Document ${documentId} not found; skipping job ${job.id}`);
      return;
    }
    if (!doc.storagePath) {
      this.logger.warn(`Document ${documentId} has no storagePath; skipping job ${job.id}`);
      return;
    }

    const buffer = await this.storage.read(doc.storagePath);
    // processFromBuffer already catches extract/embed errors and persists
    // status: FAILED + doc.error itself, so no extra error handling needed here.
    await this.documents.processFromBuffer(doc, buffer);
  }
}
