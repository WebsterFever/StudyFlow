import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PLANNER_GOAL_PRIORITIES, type PlannerGoalPriority } from '../planner-goal.entity';

export const PLANNER_REMINDER_INTERVAL_MINUTES_OPTIONS = [60, 120, 240, 360, 720, 1440, 2880, 10080];

export class CreatePlannerGoalDto {
  @IsString()
  @MinLength(1, { message: 'Goal name cannot be empty.' })
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Deadline must be a valid date.' })
  deadline?: string;

  @IsOptional()
  @IsIn(PLANNER_GOAL_PRIORITIES, { message: `Priority must be one of: ${PLANNER_GOAL_PRIORITIES.join(', ')}` })
  priority?: PlannerGoalPriority;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  @IsOptional()
  @IsIn(PLANNER_REMINDER_INTERVAL_MINUTES_OPTIONS, { message: `reminderIntervalMinutes must be one of: ${PLANNER_REMINDER_INTERVAL_MINUTES_OPTIONS.join(', ')}` })
  reminderIntervalMinutes?: number;
}
