import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/strategies/jwt.strategy';
import { RagQueryDto } from './dto/rag-query.dto';
import { RagService } from './rag.service';

@Controller('rag')
@UseGuards(JwtAuthGuard)
export class RagController {
  constructor(private readonly rag: RagService) {}

  @Post('query')
  query(@CurrentUser() user: CurrentUserData, @Body() dto: RagQueryDto) {
    return this.rag.answer(user.userId, dto.question, dto.topK, dto.documentIds ?? []);
  }
}
