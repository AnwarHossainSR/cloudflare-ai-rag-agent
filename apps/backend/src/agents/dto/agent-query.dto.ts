import { IsArray, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class AgentQueryDto {
  @IsString()
  @MinLength(3)
  question!: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  documentIds?: string[];
}
