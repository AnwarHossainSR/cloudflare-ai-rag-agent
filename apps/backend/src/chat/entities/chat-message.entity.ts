import { ChatRole, Confidence, SourceCitation } from '@devdocs/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_chat_messages_session_id')
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @ManyToOne(() => ChatSession, (session) => session.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session!: ChatSession;

  @Column({ type: 'varchar', length: 32 })
  role!: ChatRole;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  citations!: SourceCitation[];

  @Column({ type: 'varchar', length: 32, nullable: true })
  confidence!: Confidence | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
