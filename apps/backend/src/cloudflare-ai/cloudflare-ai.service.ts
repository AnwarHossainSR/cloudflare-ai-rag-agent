import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage, TokenUsage } from './types';

@Injectable()
export class CloudflareAiService {
  constructor(private readonly config: ConfigService) {}

  private get base() {
    const acc = this.config.getOrThrow<string>('CLOUDFLARE_ACCOUNT_ID');
    return `https://api.cloudflare.com/client/v4/accounts/${acc}/ai/run`;
  }

  private async run<T>(modelId: string, body: unknown): Promise<T> {
    const token = this.config.getOrThrow<string>('CLOUDFLARE_API_TOKEN');
    const res = await fetch(`${this.base}/${modelId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new BadGatewayException(`Cloudflare AI HTTP ${res.status}`);
    const json: any = await res.json();
    if (!json.success) {
      const message =
        json.errors?.map((e: any) => e.message).join('; ') ?? 'Cloudflare AI error';
      throw new BadGatewayException(message);
    }
    return json.result as T;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const model = this.config.getOrThrow<string>('CLOUDFLARE_EMBEDDING_MODEL');
    const result = await this.run<{ data: number[][] }>(model, { text: texts });
    return result.data;
  }

  async chat(
    messages: ChatMessage[],
    opts?: { maxTokens?: number; temperature?: number },
  ): Promise<{ text: string; usage?: TokenUsage }> {
    const model = this.config.getOrThrow<string>('CLOUDFLARE_CHAT_MODEL');
    const result = await this.run<{ response: string; usage?: TokenUsage }>(model, {
      messages,
      max_tokens: opts?.maxTokens ?? 1024,
      temperature: opts?.temperature ?? 0.2,
    });
    return { text: result.response, usage: result.usage };
  }
}
