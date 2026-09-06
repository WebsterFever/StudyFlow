import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreatePlannerMilestoneDto {
  @IsUUID(undefined, { message: 'goalId is required.' })
  goalId: string;

  @IsString()
  @MinLength(1, { message: 'Title cannot be empty.' })
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid date.' })
  dueDate?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}
