import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChatTables1700000000002 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE chat_sessions (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title varchar(160) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now());`);
    await q.query(`CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);`);

    await q.query(`CREATE TABLE chat_messages (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role varchar(32) NOT NULL,
      content text NOT NULL,
      citations jsonb NOT NULL DEFAULT '[]'::jsonb,
      confidence varchar(32),
      created_at timestamptz NOT NULL DEFAULT now());`);
    await q.query(`CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE chat_messages;`);
    await q.query(`DROP TABLE chat_sessions;`);
  }
}
