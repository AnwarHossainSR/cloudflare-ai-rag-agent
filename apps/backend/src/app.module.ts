import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { CloudflareAiModule } from './cloudflare-ai/cloudflare-ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    CloudflareAiModule,
  ],
})
export class AppModule {}
