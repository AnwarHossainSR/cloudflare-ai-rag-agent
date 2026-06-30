import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const UPLOADS_DIR = join(process.cwd(), 'uploads');

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Local-filesystem-backed document storage. Abstracted behind this interface
 * so a remote backend (S3/R2) can replace it later without touching callers.
 */
@Injectable()
export class StorageService {
  async save(documentId: string, buffer: Buffer, originalFilename: string): Promise<string> {
    await mkdir(UPLOADS_DIR, { recursive: true });
    const storagePath = join(UPLOADS_DIR, `${documentId}-${sanitizeFilename(originalFilename)}`);
    await writeFile(storagePath, buffer);
    return storagePath;
  }

  async read(storagePath: string): Promise<Buffer> {
    return readFile(storagePath);
  }
}
