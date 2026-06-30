import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/strategies/jwt.strategy';
import { AgentsService } from './agents.service';
import { AgentQueryDto } from './dto/agent-query.dto';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Post('query')
  query(@CurrentUser() user: CurrentUserData, @Body() dto: AgentQueryDto) {
    return this.agents.run(user.userId, dto.question, dto.sessionId);
  }

  @Get('runs/:id')
  getRun(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.agents.getRun(user.userId, id);
  }
}
