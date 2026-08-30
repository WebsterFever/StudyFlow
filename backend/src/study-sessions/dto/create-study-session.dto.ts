import { IsBoolean, IsDateString, IsIn, IsInt, IsISO8601, IsOptional, IsUUID, Min } from 'class-validator';
import type { SessionStatus } from '../study-session.entity';

export const SESSION_STATUSES: SessionStatus[] = ['planned', 'in-progress', 'completed', 'skipped'];

export class CreateStudySessionDto {
  // Client-generated (crypto.randomUUID()) so the frontend's plan generator
  // can build the full session list synchronously before it round-trips.
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  itemId: string;

  @IsDateString({}, { message: 'Date must be a valid date.' })
  date: string;

  @IsInt()
  order: number;

  @IsInt()
  @Min(1, { message: 'Planned minutes must be greater than zero.' })
  plannedMinutes: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  partIndex?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  partTotal?: number;

  @IsOptional()
  @IsIn(SESSION_STATUSES, { message: `Status must be one of: ${SESSION_STATUSES.join(', ')}` })
  status?: SessionStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  actualMinutes?: number | null;

  @IsOptional()
  @IsISO8601()
  startedAt?: string | null;

  @IsOptional()
  @IsISO8601()
  completedAt?: string | null;

  @IsOptional()
  @IsBoolean()
  manuallyAdjusted?: boolean;
}
