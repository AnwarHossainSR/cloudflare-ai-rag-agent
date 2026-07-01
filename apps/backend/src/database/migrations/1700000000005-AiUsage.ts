import { MigrationInterface, QueryRunner } from 'typeorm';

export class AiUsage1700000000005 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE ai_usage (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid NULL,
        model varchar(160) NOT NULL,
        operation varchar(16) NOT NULL,
        prompt_tokens int NOT NULL DEFAULT 0,
        completion_tokens int NOT NULL DEFAULT 0,
        total_tokens int NOT NULL DEFAULT 0,
        estimated_cost_usd numeric(14,8) NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await q.query(`CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);`);
    await q.query(`CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at);`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS idx_ai_usage_created_at;`);
    await q.query(`DROP INDEX IF EXISTS idx_ai_usage_user_id;`);
    await q.query(`DROP TABLE IF EXISTS ai_usage;`);
  }
}
