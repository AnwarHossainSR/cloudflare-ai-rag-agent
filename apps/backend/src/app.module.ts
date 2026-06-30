import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validateEnv } from './config/env.validation';
import { CloudflareAiModule } from './cloudflare-ai/cloudflare-ai.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { RagModule } from './rag/rag.module';
import { ChatModule } from './chat/chat.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { Document } from './documents/entities/document.entity';
import { DocumentChunk } from './documents/entities/document-chunk.entity';
import { ChatSession } from './chat/entities/chat-session.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'], validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        entities: [User, Document, DocumentChunk, ChatSession, ChatMessage],
        synchronize: false,
      }),
    }),
    CloudflareAiModule,
    UsersModule,
    AuthModule,
    DocumentsModule,
    RagModule,
    ChatModule,
  ],
})
export class AppModule {}
