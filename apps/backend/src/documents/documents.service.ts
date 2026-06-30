import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DocumentStatus } from '@devdocs/shared';
import { Repository } from 'typeorm';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { Document } from './entities/document.entity';
import { DocumentChunk } from './entities/document-chunk.entity';
import { extractText } from './text-extraction';

export interface UploadedFileMeta {
  originalname: string;
  mimetype: string;
  size: number;
}

export type DocumentWithChunkCount = Document & { chunkCount: number };

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private readonly docs: Repository<Document>,
    @InjectRepository(DocumentChunk) private readonly chunks: Repository<DocumentChunk>,
    private readonly embeddings: EmbeddingsService,
  ) {}

  create(userId: string, file: UploadedFileMeta): Promise<Document> {
    return this.docs.save(
      this.docs.create({
        userId,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        status: DocumentStatus.PENDING,
        error: null,
      }),
    );
  }

  async processInline(doc: Document, buffer: Buffer): Promise<void> {
    doc.status = DocumentStatus.PROCESSING;
    doc.error = null;
    await this.docs.save(doc);

    try {
      const text = await extractText(buffer, doc.mimeType, doc.filename);
      await this.embeddings.processDocument(doc.id, text, doc.filename);
      doc.status = DocumentStatus.READY;
      doc.error = null;
    } catch (err) {
      doc.status = DocumentStatus.FAILED;
      doc.error = err instanceof Error ? err.message : 'Document processing failed';
    }

    await this.docs.save(doc);
  }

  async findAllForUser(userId: string): Promise<DocumentWithChunkCount[]> {
    const docs = await this.docs.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return Promise.all(docs.map((doc) => this.withChunkCount(doc)));
  }

  async findOneForUser(userId: string, id: string): Promise<DocumentWithChunkCount> {
    return this.withChunkCount(await this.getOwnedDocument(userId, id));
  }

  async reindex(userId: string, id: string): Promise<DocumentWithChunkCount> {
    const doc = await this.getOwnedDocument(userId, id);
    const oldChunks = await this.chunks.find({
      where: { documentId: doc.id },
      order: { chunkIndex: 'ASC' },
    });
    if (!oldChunks.length) throw new BadRequestException('Document has no chunks to reindex');

    doc.status = DocumentStatus.PROCESSING;
    doc.error = null;
    await this.docs.save(doc);

    try {
      await this.chunks.delete({ documentId: doc.id });
      await this.embeddings.processDocument(
        doc.id,
        oldChunks.map((chunk) => chunk.content).join('\n\n'),
        doc.filename,
      );
      doc.status = DocumentStatus.READY;
      doc.error = null;
    } catch (err) {
      doc.status = DocumentStatus.FAILED;
      doc.error = err instanceof Error ? err.message : 'Document reindex failed';
    }

    return this.withChunkCount(await this.docs.save(doc));
  }

  async remove(userId: string, id: string): Promise<void> {
    const doc = await this.getOwnedDocument(userId, id);
    await this.docs.remove(doc);
  }

  private async getOwnedDocument(userId: string, id: string): Promise<Document> {
    const doc = await this.docs.findOne({ where: { id } });
    if (!doc || doc.userId !== userId) throw new NotFoundException('Document not found');
    return doc;
  }

  private async withChunkCount(doc: Document): Promise<DocumentWithChunkCount> {
    const chunkCount = await this.chunks.count({ where: { documentId: doc.id } });
    return Object.assign(doc, { chunkCount });
  }
}
