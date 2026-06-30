import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRole } from '@devdocs/shared';
import { Repository } from 'typeorm';
import { RagService } from '../rag/rag.service';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatSession } from './entities/chat-session.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly sessions: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messages: Repository<ChatMessage>,
    private readonly rag: RagService,
  ) {}

  createSession(userId: string, title?: string): Promise<ChatSession> {
    return this.sessions.save(
      this.sessions.create({ userId, title: title?.trim() || 'New chat' }),
    );
  }

  listSessions(userId: string): Promise<ChatSession[]> {
    return this.sessions.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async getMessages(userId: string, sessionId: string): Promise<ChatMessage[]> {
    await this.getSessionForUser(userId, sessionId);
    return this.messages.find({ where: { sessionId }, order: { createdAt: 'ASC' } });
  }

  async postMessage(userId: string, sessionId: string, content: string): Promise<ChatMessage> {
    const session = await this.getSessionForUser(userId, sessionId);
    const question = content.trim();

    if (session.title === 'New chat') {
      session.title = makeTitle(question);
      await this.sessions.save(session);
    }

    await this.messages.save(
      this.messages.create({
        sessionId,
        role: ChatRole.USER,
        content: question,
        citations: [],
        confidence: null,
      }),
    );

    const answer = await this.rag.answer(userId, question);
    return this.messages.save(
      this.messages.create({
        sessionId,
        role: ChatRole.ASSISTANT,
        content: answer.answer,
        citations: answer.citations,
        confidence: answer.confidence,
      }),
    );
  }

  private async getSessionForUser(userId: string, id: string): Promise<ChatSession> {
    const session = await this.sessions.findOne({ where: { id, userId } });
    if (!session) throw new NotFoundException('Chat session not found');
    return session;
  }
}

function makeTitle(question: string): string {
  return question.slice(0, 60) || 'New chat';
}
