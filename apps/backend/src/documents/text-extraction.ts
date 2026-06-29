import { UnsupportedMediaTypeException } from '@nestjs/common';

const TEXT_MIME_TYPES = new Set(['text/plain', 'text/markdown']);

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename = '',
): Promise<string> {
  const isMarkdownOctetStream =
    mimeType === 'application/octet-stream' && /\.(md|markdown|txt)$/i.test(filename);

  if (TEXT_MIME_TYPES.has(mimeType) || isMarkdownOctetStream) {
    return buffer.toString('utf-8').replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  if (mimeType === 'application/pdf') {
    throw new UnsupportedMediaTypeException('PDF support arrives in M2');
  }

  throw new UnsupportedMediaTypeException(`Unsupported file type: ${mimeType}`);
}
