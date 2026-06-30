import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Confidence, SourceCitation } from '@devdocs/shared';
import { Repository } from 'typeorm';
import { CloudflareAiService } from '../cloudflare-ai/cloudflare-ai.service';
import { RagService } from '../rag/rag.service';
import { buildAgentGraph } from './graph/build-graph';
import { AgentRun } from './entities/agent-run.entity';
import { AgentStep } from './entities/agent-step.entity';

export interface AgentRunResult {
  runId: string;
  answer: string;
  citations: SourceCitation[];
  confidence: Confidence;
  steps: AgentStep[];
}

@Injectable()
export class AgentsService {
  private readonly graph: ReturnType<typeof buildAgentGraph>;

  constructor(
    private readonly ai: CloudflareAiService,
    private readonly rag: RagService,
    @InjectRepository(AgentRun)
    private readonly runRepo: Repository<AgentRun>,
    @InjectRepository(AgentStep)
    private readonly stepRepo: Repository<AgentStep>,
  ) {
    this.graph = buildAgentGraph({ ai: this.ai, rag: this.rag });
  }

  async run(userId: string, question: string, sessionId?: string): Promise<AgentRunResult> {
    try {
      const state = await this.graph.invoke({ userId, question });

      const savedRun = await this.runRepo.save(
        this.runRepo.create({
          userId,
          sessionId: sessionId ?? null,
          question,
          finalAnswer: state.answer,
          confidence: state.confidence,
          status: 'completed',
          retryCount: state.retryCount,
        }),
      );

      const stepRows = state.steps.map((step, index) =>
        this.stepRepo.create({
          runId: savedRun.id,
          name: step.name,
          input: step.input as object | null,
          output: step.output as object | null,
          latencyMs: step.latencyMs,
          order: index,
        }),
      );
      const savedSteps = await this.stepRepo.save(stepRows);

      return {
        runId: savedRun.id,
        answer: state.answer,
        citations: state.citations,
        confidence: state.confidence,
        steps: savedSteps,
      };
    } catch (err) {
      await this.runRepo.save(
        this.runRepo.create({
          userId,
          sessionId: sessionId ?? null,
          question,
          finalAnswer: null,
          confidence: null,
          status: 'failed',
          retryCount: 0,
        }),
      );
      throw err;
    }
  }

  async getRun(userId: string, id: string): Promise<AgentRun & { steps: AgentStep[] }> {
    const run = await this.runRepo.findOne({ where: { id } });
    if (!run || run.userId !== userId) throw new NotFoundException('Agent run not found');

    const steps = await this.stepRepo.find({
      where: { runId: id },
      order: { order: 'ASC' },
    });

    return { ...run, steps };
  }
}
