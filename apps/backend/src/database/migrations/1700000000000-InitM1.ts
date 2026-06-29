import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitM1_1700000000000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
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
    await q.query(`CREATE INDEX idx_documents_user_id ON documents(user_id);`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE documents;`);
    await q.query(`DROP TABLE users;`);
  }
}
