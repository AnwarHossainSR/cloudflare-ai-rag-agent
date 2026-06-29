import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DocumentStatus } from '@devdocs/shared';
import { Repository } from 'typeorm';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { Document } from './entities/document.entity';
import { extractText } from './text-extraction';

export interface UploadedFileMeta {
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private readonly docs: Repository<Document>,
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

  findAllForUser(userId: string): Promise<Document[]> {
    return this.docs.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOneForUser(userId: string, id: string): Promise<Document> {
    const doc = await this.docs.findOne({ where: { id } });
    if (!doc || doc.userId !== userId) throw new NotFoundException('Document not found');
    return doc;
  }

  async remove(userId: string, id: string): Promise<void> {
    const doc = await this.findOneForUser(userId, id);
    await this.docs.remove(doc);
  }
}
