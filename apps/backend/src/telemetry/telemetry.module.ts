import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USAGE_RECORDER } from '../cloudflare-ai/types';
import { AiUsage } from './entities/ai-usage.entity';
import { UsageService } from './usage.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiUsage])],
  providers: [UsageService, { provide: USAGE_RECORDER, useExisting: UsageService }],
  exports: [UsageService, USAGE_RECORDER],
})
export class TelemetryModule {}
