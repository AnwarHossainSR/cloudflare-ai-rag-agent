import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Document } from './document.entity';
import { vectorTransformer } from '../../database/transformers/vector.transformer';

@Entity('document_chunks')
export class DocumentChunk {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_chunks_document_id')
  @Column({ name: 'document_id', type: 'uuid' })
  documentId!: string;

  @ManyToOne(() => Document, (doc) => doc.chunks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document!: Document;

  @Column({ name: 'chunk_index', type: 'integer' })
  chunkIndex!: number;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'source_filename', type: 'varchar', length: 512 })
  sourceFilename!: string;

  @Column({ name: 'token_count', type: 'integer' })
  tokenCount!: number;

  // DDL for the real vector(1024) column comes from the migration, not synchronize.
  @Column({ type: 'text', transformer: vectorTransformer, select: false })
  embedding!: number[];
}
