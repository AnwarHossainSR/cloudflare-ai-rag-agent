import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { DOCUMENT_PROCESSING_QUEUE } from './documents.constants';

export interface DocumentProcessingJobData {
  documentId: string;
}

/**
 * Thin wrapper around the BullMQ queue so callers (e.g. the controller) don't
 * need to know about queue names or job shapes directly.
 */
@Injectable()
export class DocumentsQueueService {
  constructor(
    @InjectQueue(DOCUMENT_PROCESSING_QUEUE) private readonly queue: Queue<DocumentProcessingJobData>,
  ) {}

  async enqueueProcessing(documentId: string): Promise<void> {
    await this.queue.add('process', { documentId });
  }
}
