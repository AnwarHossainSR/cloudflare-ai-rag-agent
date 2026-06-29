import { DocumentStatus } from '@devdocs/shared';

export class UploadResultDto {
  id!: string;
  filename!: string;
  mimeType!: string;
  sizeBytes!: number;
  status!: DocumentStatus;
  error!: string | null;
}
