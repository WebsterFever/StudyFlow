import { plainToInstance } from 'class-transformer';
import { IsBooleanString, IsNotEmpty, IsNumberString, IsOptional, IsString, MinLength, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL is required (Railway Postgres connection string).' })
  DATABASE_URL: string;

  @IsString()
  @MinLength(16, { message: 'JWT_SECRET must be at least 16 characters.' })
  JWT_SECRET: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  @IsOptional()
  @IsNumberString()
  PORT?: string;

  @IsOptional()
  @IsString()
  FRONTEND_URL?: string;

  @IsOptional()
  @IsBooleanString()
  DB_SYNCHRONIZE?: string;

  @IsOptional()
  @IsBooleanString()
  DB_SSL?: string;
}

/** Fails fast on boot if required environment variables are missing/invalid. */
export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });
  if (errors.length > 0) {
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    throw new Error(`Invalid environment configuration:\n${messages.join('\n')}`);
  }
  return validatedConfig;
}
