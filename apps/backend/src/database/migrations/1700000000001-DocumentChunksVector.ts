import { MigrationInterface, QueryRunner } from 'typeorm';

export class DocumentChunksVector1700000000001 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
    await q.query(`CREATE TABLE document_chunks (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      chunk_index integer NOT NULL,
      content text NOT NULL,
      source_filename varchar(512) NOT NULL,
      token_count integer NOT NULL,
      embedding vector(1024));`);
    await q.query(`CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);`);
    await q.query(`CREATE INDEX idx_chunks_embedding ON document_chunks
      USING hnsw (embedding vector_cosine_ops);`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE document_chunks;`);
  }
}
