import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/strategies/jwt.strategy';
import { ChatService } from './chat.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { PostMessageDto } from './dto/post-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('sessions')
  createSession(@CurrentUser() user: CurrentUserData, @Body() dto: CreateSessionDto) {
    return this.chat.createSession(user.userId, dto.title);
  }

  @Get('sessions')
  listSessions(@CurrentUser() user: CurrentUserData) {
    return this.chat.listSessions(user.userId);
  }

  @Get('sessions/:id/messages')
  getMessages(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.chat.getMessages(user.userId, id);
  }

  @Post('sessions/:id/messages')
  postMessage(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: PostMessageDto,
  ) {
    return this.chat.postMessage(user.userId, id, dto.content);
  }
}
