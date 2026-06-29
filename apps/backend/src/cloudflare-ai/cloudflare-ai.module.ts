import { Module } from '@nestjs/common';
import { CloudflareAiService } from './cloudflare-ai.service';

@Module({
  providers: [CloudflareAiService],
  exports: [CloudflareAiService],
})
export class CloudflareAiModule {}
