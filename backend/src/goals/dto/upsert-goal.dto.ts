import { IsDateString, IsObject, IsString, MaxLength, MinLength } from 'class-validator';
import type { DailyHours } from '../goal.entity';

export class UpsertGoalDto {
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
}
