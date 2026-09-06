import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateExamDto {
  @IsUUID(undefined, { message: 'goalId is required.' })
  goalId: string;

  @IsString()
  @MinLength(1, { message: 'Title cannot be empty.' })
  @MaxLength(255)
  title: string;

  @IsDateString({}, { message: 'Exam date must be a valid date.' })
  examDate: string;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;
}
