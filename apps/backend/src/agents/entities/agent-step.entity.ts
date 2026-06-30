import { AgentStepName } from '@devdocs/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AgentRun } from './agent-run.entity';

@Entity('agent_steps')
export class AgentStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_agent_steps_run_id')
  @Column({ name: 'run_id', type: 'uuid' })
  runId!: string;

  @ManyToOne(() => AgentRun, (run) => run.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'run_id' })
  run!: AgentRun;

  @Column({ type: 'varchar', length: 32 })
  name!: AgentStepName;

  @Column({ type: 'jsonb', nullable: true })
  input!: object | null;

  @Column({ type: 'jsonb', nullable: true })
  output!: object | null;

  @Column({ name: 'latency_ms', type: 'int', nullable: true })
  latencyMs!: number | null;

  @Column({ name: 'order', type: 'int' })
  order!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
