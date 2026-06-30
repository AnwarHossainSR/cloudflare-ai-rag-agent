import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { validateEnv } from './config/env.validation';
import { CloudflareAiModule } from './cloudflare-ai/cloudflare-ai.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { RagModule } from './rag/rag.module';
import { ChatModule } from './chat/chat.module';
import { AgentsModule } from './agents/agents.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { Document } from './documents/entities/document.entity';
import { DocumentChunk } from './documents/entities/document-chunk.entity';
import { ChatSession } from './chat/entities/chat-session.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';
import { AgentRun } from './agents/entities/agent-run.entity';
import { AgentStep } from './agents/entities/agent-step.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'], validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        entities: [User, Document, DocumentChunk, ChatSession, ChatMessage, AgentRun, AgentStep],
        synchronize: false,
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = new URL(config.getOrThrow<string>('REDIS_URL'));
        return {
          connection: {
            host: redisUrl.hostname,
            port: Number(redisUrl.port) || 6379,
            ...(redisUrl.password ? { password: redisUrl.password } : {}),
          },
        };
      },
    }),
    CloudflareAiModule,
    UsersModule,
    AuthModule,
    DocumentsModule,
    RagModule,
    ChatModule,
    AgentsModule,
  ],
})
export class AppModule {}
