import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { PLANNER_TASK_PRIORITIES, PLANNER_TASK_STATUSES, type PlannerTaskPriority, type PlannerTaskStatus } from '../planner-task.entity';

export class CreatePlannerTaskDto {
  @IsUUID(undefined, { message: 'goalId is required.' })
  goalId: string;

  @IsOptional()
  @IsUUID(undefined, { message: 'milestoneId must be a valid id.' })
  milestoneId?: string;

  @IsString()
  @MinLength(1, { message: 'Title cannot be empty.' })
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid date.' })
  dueDate?: string;

  @IsOptional()
  @IsIn(PLANNER_TASK_PRIORITIES, { message: `Priority must be one of: ${PLANNER_TASK_PRIORITIES.join(', ')}` })
  priority?: PlannerTaskPriority;

  @IsOptional()
  @IsIn(PLANNER_TASK_STATUSES, { message: `Status must be one of: ${PLANNER_TASK_STATUSES.join(', ')}` })
  status?: PlannerTaskStatus;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  recurrenceIntervalDays?: number;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;
}
