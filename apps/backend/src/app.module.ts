import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validateEnv } from './config/env.validation';
import { CloudflareAiModule } from './cloudflare-ai/cloudflare-ai.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { Document } from './documents/entities/document.entity';
import { DocumentChunk } from './documents/entities/document-chunk.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        entities: [User, Document, DocumentChunk],
        synchronize: false,
      }),
    }),
    CloudflareAiModule,
    UsersModule,
    AuthModule,
    DocumentsModule,
  ],
})
export class AppModule {}
