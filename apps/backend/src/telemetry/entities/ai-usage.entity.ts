import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { AiOperation } from '../../cloudflare-ai/types';

@Entity('ai_usage')
export class AiUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_ai_usage_user_id')
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 160 })
  model!: string;

  @Column({ type: 'varchar', length: 16 })
  operation!: AiOperation;

  @Column({ name: 'prompt_tokens', type: 'int', default: 0 })
  promptTokens!: number;

  @Column({ name: 'completion_tokens', type: 'int', default: 0 })
  completionTokens!: number;

  @Column({ name: 'total_tokens', type: 'int', default: 0 })
  totalTokens!: number;

  @Column({ name: 'estimated_cost_usd', type: 'numeric', precision: 14, scale: 8, default: 0 })
  estimatedCostUsd!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
