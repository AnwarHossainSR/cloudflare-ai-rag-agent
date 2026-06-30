import { UnprocessableEntityException } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import { extractText } from './text-extraction';

jest.mock('pdf-parse', () =>
  jest.fn(async (buffer: Buffer) => {
    if (buffer.toString('utf8').includes('corrupt')) {
      throw new Error('bad pdf');
    }

    return { text: 'PDF guide\0 for uploads' };
  }),
);

describe('extractText PDF support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('extracts and sanitizes PDF text', async () => {
    const text = await extractText(Buffer.from('%PDF fixture'), 'application/pdf', 'guide.pdf');

    expect(text).toBe('PDF guide for uploads');
    expect(pdfParse).toHaveBeenCalledWith(Buffer.from('%PDF fixture'));
  });

  it('wraps corrupt PDFs as unprocessable files', async () => {
    await expect(
      extractText(Buffer.from('%PDF corrupt'), 'application/pdf', 'broken.pdf'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
