import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CloudflareAiService } from './cloudflare-ai.service';

const cfg = (k: string) =>
  ({
    CLOUDFLARE_ACCOUNT_ID: 'acc123',
    CLOUDFLARE_API_TOKEN: 'tok456',
    CLOUDFLARE_CHAT_MODEL: '@cf/meta/llama-3.2-3b-instruct',
    CLOUDFLARE_EMBEDDING_MODEL: '@cf/baai/bge-large-en-v1.5',
  })[k];

describe('CloudflareAiService', () => {
  let service: CloudflareAiService;
  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        CloudflareAiService,
        { provide: ConfigService, useValue: { getOrThrow: cfg, get: cfg } },
      ],
    }).compile();
    service = mod.get(CloudflareAiService);
    global.fetch = jest.fn();
  });

  it('embeds text and returns 1024-d vectors, hitting the correct URL + auth header', async () => {
    const vec = Array.from({ length: 1024 }, () => 0.01);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, result: { data: [vec] } }),
    });
    const out = await service.embed(['hello']);
    expect(out[0]).toHaveLength(1024);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(
      'https://api.cloudflare.com/client/v4/accounts/acc123/ai/run/@cf/baai/bge-large-en-v1.5',
    );
    expect(init.headers.Authorization).toBe('Bearer tok456');
  });

  it('chats and returns the response text', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, result: { response: 'Hi there' } }),
    });
    const out = await service.chat([{ role: 'user', content: 'hi' }]);
    expect(out.text).toBe('Hi there');
  });

  it('throws when Cloudflare returns success:false', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, errors: [{ message: 'bad token' }] }),
    });
    await expect(service.embed(['x'])).rejects.toThrow(/bad token/);
  });
});
