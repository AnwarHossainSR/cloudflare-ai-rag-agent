import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitM1_1700000000000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
    await q.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await q.query(`CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      email varchar(255) UNIQUE NOT NULL,
      password_hash varchar(255) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now());`);
    await q.query(`CREATE TABLE documents (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename varchar(512) NOT NULL,
      mime_type varchar(128) NOT NULL,
      size_bytes integer NOT NULL,
      status varchar(32) NOT NULL DEFAULT 'pending',
      error text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now());`);
    await q.query(`CREATE TABLE document_chunks (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      chunk_index integer NOT NULL,
      content text NOT NULL,
      source_filename varchar(512) NOT NULL,
      token_count integer NOT NULL,
      embedding vector(1024));`);
    await q.query(`CREATE INDEX idx_documents_user_id ON documents(user_id);`);
    await q.query(`CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);`);
    await q.query(`CREATE INDEX idx_chunks_embedding ON document_chunks
      USING hnsw (embedding vector_cosine_ops);`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE document_chunks;`);
    await q.query(`DROP TABLE documents;`);
    await q.query(`DROP TABLE users;`);
  }
}
