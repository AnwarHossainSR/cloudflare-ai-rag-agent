import { Module } from '@nestjs/common';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { CloudflareAiService } from './cloudflare-ai.service';

@Module({
  imports: [TelemetryModule],
  providers: [CloudflareAiService],
  exports: [CloudflareAiService],
})
export class CloudflareAiModule {}
