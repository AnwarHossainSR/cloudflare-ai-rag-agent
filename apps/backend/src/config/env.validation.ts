import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

export class EnvVars {
  @IsString() @IsNotEmpty() CLOUDFLARE_ACCOUNT_ID!: string;
  @IsString() @IsNotEmpty() CLOUDFLARE_API_TOKEN!: string;
  @IsString() CLOUDFLARE_CHAT_MODEL!: string;
  @IsString() CLOUDFLARE_EMBEDDING_MODEL!: string;
  @IsString() @IsNotEmpty() DATABASE_URL!: string;
  @IsString() @IsNotEmpty() JWT_SECRET!: string;
  @IsString() @IsNotEmpty() REDIS_URL!: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvVars, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length) throw new Error(`Config validation failed: ${errors.toString()}`);
  return validated;
}
