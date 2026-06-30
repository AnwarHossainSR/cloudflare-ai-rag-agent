import { DocumentStatus } from '@devdocs/shared';
import { Job } from 'bullmq';
import { DocumentsProcessor } from './documents.processor';
import { DocumentsService } from './documents.service';
import { StorageService } from './storage.service';

describe('DocumentsProcessor', () => {
  let documents: jest.Mocked<Pick<DocumentsService, 'findById' | 'processFromBuffer'>>;
  let storage: jest.Mocked<Pick<StorageService, 'read' | 'save'>>;
  let processor: DocumentsProcessor;

  const doc = {
    id: 'doc-1',
    filename: 'guide.md',
    mimeType: 'text/markdown',
    storagePath: 'uploads/doc-1-guide.md',
    status: DocumentStatus.PENDING,
  } as any;

  beforeEach(() => {
    documents = {
      findById: jest.fn().mockResolvedValue(doc),
      processFromBuffer: jest.fn().mockResolvedValue(undefined),
    };
    storage = {
      read: jest.fn().mockResolvedValue(Buffer.from('# hello')),
      save: jest.fn(),
    };
    processor = new DocumentsProcessor(documents as unknown as DocumentsService, storage as unknown as StorageService);
  });

  it('processes a job to ready on success', async () => {
    documents.processFromBuffer.mockImplementation(async (d: any) => {
      d.status = DocumentStatus.READY;
    });

    await processor.process({ data: { documentId: 'doc-1' } } as Job<{ documentId: string }>);

    expect(documents.findById).toHaveBeenCalledWith('doc-1');
    expect(storage.read).toHaveBeenCalledWith('uploads/doc-1-guide.md');
    expect(documents.processFromBuffer).toHaveBeenCalledWith(doc, Buffer.from('# hello'));
    expect(doc.status).toBe(DocumentStatus.READY);
  });

  it('marks the document failed when processing throws', async () => {
    documents.processFromBuffer.mockImplementation(async (d: any) => {
      d.status = DocumentStatus.FAILED;
      d.error = 'embed failed';
    });

    await processor.process({ data: { documentId: 'doc-1' } } as Job<{ documentId: string }>);

    expect(doc.status).toBe(DocumentStatus.FAILED);
    expect(doc.error).toBe('embed failed');
  });
});
