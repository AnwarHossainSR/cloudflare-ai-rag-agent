import { MigrationInterface, QueryRunner } from 'typeorm';

export class AgentTables1700000000003 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE agent_runs (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_id uuid REFERENCES chat_sessions(id) ON DELETE SET NULL,
      question text NOT NULL,
      final_answer text,
      confidence varchar(32),
      status varchar(32) NOT NULL,
      retry_count int NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now());`);
    await q.query(`CREATE INDEX idx_agent_runs_user_id ON agent_runs(user_id);`);
    await q.query(`CREATE INDEX idx_agent_runs_session_id ON agent_runs(session_id);`);

    await q.query(`CREATE TABLE agent_steps (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      run_id uuid NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
      name varchar(32) NOT NULL,
      input jsonb,
      output jsonb,
      latency_ms int,
      "order" int NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now());`);
    await q.query(`CREATE INDEX idx_agent_steps_run_id ON agent_steps(run_id);`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE agent_steps;`);
    await q.query(`DROP TABLE agent_runs;`);
  }
}
