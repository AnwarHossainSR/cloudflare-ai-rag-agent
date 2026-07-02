import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export class RagQueryDto {
  @IsString()
  @MinLength(3)
  question!: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(8)
  topK?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  documentIds?: string[];
}
