import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class AgentQueryDto {
  @IsString()
  @MinLength(3)
  question!: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
