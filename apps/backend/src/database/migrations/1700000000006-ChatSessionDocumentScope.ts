import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChatSessionDocumentScope1700000000006 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE chat_sessions ADD COLUMN document_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE chat_sessions DROP COLUMN document_ids;`);
  }
}

