import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudflareAiModule } from '../cloudflare-ai/cloudflare-ai.module';
import { RagModule } from '../rag/rag.module';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentRun } from './entities/agent-run.entity';
import { AgentStep } from './entities/agent-step.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AgentRun, AgentStep]), CloudflareAiModule, RagModule],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
