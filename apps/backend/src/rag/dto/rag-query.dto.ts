import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class RagQueryDto {
  @IsString()
  @MinLength(3)
  question!: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(8)
  topK?: number;
}
