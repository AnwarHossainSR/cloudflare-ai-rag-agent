import { UnprocessableEntityException, UnsupportedMediaTypeException } from '@nestjs/common';
import pdfParse from 'pdf-parse';

const TEXT_MIME_TYPES = new Set(['text/plain', 'text/markdown']);

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename = '',
): Promise<string> {
  const isMarkdownOctetStream =
    mimeType === 'application/octet-stream' && /\.(md|markdown|txt)$/i.test(filename);

  if (TEXT_MIME_TYPES.has(mimeType) || isMarkdownOctetStream) {
    return sanitizeText(buffer.toString('utf-8'));
  }

  if (mimeType === 'application/pdf') {
    try {
      const data = await pdfParse(buffer);
      return sanitizeText(data.text);
    } catch {
      throw new UnprocessableEntityException('Could not extract text from PDF');
    }
  }

  throw new UnsupportedMediaTypeException(`Unsupported file type: ${mimeType}`);
}

function sanitizeText(text: string) {
  return text.replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}
