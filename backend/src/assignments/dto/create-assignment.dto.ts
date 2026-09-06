import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ASSIGNMENT_PRIORITIES, ASSIGNMENT_STATUSES, type AssignmentPriority, type AssignmentStatus } from '../assignment.entity';

export class CreateAssignmentDto {
  @IsUUID(undefined, { message: 'goalId is required.' })
  goalId: string;

  @IsString()
  @MinLength(1, { message: 'Title cannot be empty.' })
  @MaxLength(255)
  title: string;

  @IsDateString({}, { message: 'Due date must be a valid date.' })
  dueDate: string;

  @IsOptional()
  @IsIn(ASSIGNMENT_STATUSES, { message: `Status must be one of: ${ASSIGNMENT_STATUSES.join(', ')}` })
  status?: AssignmentStatus;

  @IsOptional()
  @IsIn(ASSIGNMENT_PRIORITIES, { message: `Priority must be one of: ${ASSIGNMENT_PRIORITIES.join(', ')}` })
  priority?: AssignmentPriority;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;
}
