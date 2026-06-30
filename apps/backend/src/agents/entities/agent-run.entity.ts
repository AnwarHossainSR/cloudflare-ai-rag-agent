import { Confidence } from '@devdocs/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatSession } from '../../chat/entities/chat-session.entity';
import { AgentStep } from './agent-step.entity';

@Entity('agent_runs')
export class AgentRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_agent_runs_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Index('idx_agent_runs_session_id')
  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId!: string | null;

  @ManyToOne(() => ChatSession, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'session_id' })
  session!: ChatSession | null;

  @Column({ type: 'text' })
  question!: string;

  @Column({ name: 'final_answer', type: 'text', nullable: true })
  finalAnswer!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  confidence!: Confidence | null;

  @Column({ type: 'varchar', length: 32 })
  status!: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => AgentStep, (step) => step.run)
  steps!: AgentStep[];
}
