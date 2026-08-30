import { IsBoolean, IsDateString, IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { DailyHours } from '../goal.entity';

export const REMINDER_INTERVAL_HOURS_OPTIONS = [2, 4, 6, 12, 24];

export class CreateGoalDto {
  @IsString()
  @MinLength(1, { message: 'Goal name cannot be empty.' })
  @MaxLength(255)
  name: string;

  @IsDateString({}, { message: 'Start date must be a valid date.' })
  startDate: string;

  @IsDateString({}, { message: 'Deadline must be a valid date.' })
  deadline: string;

  @IsObject()
  dailyHours: DailyHours;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  @IsOptional()
  @IsIn(REMINDER_INTERVAL_HOURS_OPTIONS, { message: `reminderIntervalHours must be one of: ${REMINDER_INTERVAL_HOURS_OPTIONS.join(', ')}` })
  reminderIntervalHours?: number;
}
