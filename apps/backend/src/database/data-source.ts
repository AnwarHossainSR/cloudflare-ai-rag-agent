import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'node:path';
import { User } from '../users/entities/user.entity';
import { Document } from '../documents/entities/document.entity';
import { DocumentChunk } from '../documents/entities/document-chunk.entity';
import { ChatSession } from '../chat/entities/chat-session.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import { AgentRun } from '../agents/entities/agent-run.entity';
import { AgentStep } from '../agents/entities/agent-step.entity';
import { AiUsage } from '../telemetry/entities/ai-usage.entity';

// Load root .env when running the CLI (migrations) outside the Nest runtime.
loadEnv({ path: join(__dirname, '../../../../.env') });
loadEnv();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: false,
  entities: [User, Document, DocumentChunk, ChatSession, ChatMessage, AgentRun, AgentStep, AiUsage],
  migrations: [join(__dirname, 'migrations/*.{ts,js}')],
  migrationsTransactionMode: 'each',
});
