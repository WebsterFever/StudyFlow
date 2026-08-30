import { IsIn, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';
import type { Difficulty, Priority, StudyType } from '../study-item.entity';

export const STUDY_TYPES: StudyType[] = ['Video', 'Exercise', 'Project', 'Reading', 'Review'];
export const DIFFICULTIES: Difficulty[] = ['Easy', 'Intermediate', 'Hard'];
export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High'];

export class CreateStudyItemDto {
  // The frontend generates ids client-side (crypto.randomUUID()) so the plan
  // generator can reference a new item's id before this request round-trips.
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID(undefined, { message: 'goalId is required.' })
  goalId: string;

  @IsString()
  @MinLength(1, { message: 'Title cannot be empty.' })
  title: string;

  @IsString()
  @MinLength(1, { message: 'Course is required.' })
  course: string;

  @IsString()
  @MinLength(1, { message: 'Topic is required.' })
  topic: string;

  @IsIn(STUDY_TYPES, { message: `Type must be one of: ${STUDY_TYPES.join(', ')}` })
  type: StudyType;

  @IsInt()
  @Min(1, { message: 'Duration must be greater than zero.' })
  durationMinutes: number;

  @IsIn(DIFFICULTIES, { message: `Difficulty must be one of: ${DIFFICULTIES.join(', ')}` })
  difficulty: Difficulty;

  @IsIn(PRIORITIES, { message: `Priority must be one of: ${PRIORITIES.join(', ')}` })
  priority: Priority;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  order?: number;
}
