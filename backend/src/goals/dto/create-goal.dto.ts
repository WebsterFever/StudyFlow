import { IsBoolean, IsDateString, IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { DailyHours } from '../goal.entity';

// Values are minutes. Sub-hour options exist to let a user verify the
// reminder pipeline actually works without waiting hours for the first send.
export const REMINDER_INTERVAL_MINUTES_OPTIONS = [5, 10, 15, 30, 60, 120, 240, 360, 720, 1440];

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
  @IsIn(REMINDER_INTERVAL_MINUTES_OPTIONS, { message: `reminderIntervalMinutes must be one of: ${REMINDER_INTERVAL_MINUTES_OPTIONS.join(', ')}` })
  reminderIntervalMinutes?: number;
}
