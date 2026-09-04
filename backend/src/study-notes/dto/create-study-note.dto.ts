import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { StudyNoteType } from '../study-note.entity';
import { STUDY_NOTE_TYPES } from '../study-note.entity';

export class CreateStudyNoteDto {
  @IsUUID(undefined, { message: 'goalId is required.' })
  goalId: string;

  @IsUUID(undefined, { message: 'studyItemId is required.' })
  studyItemId: string;

  @IsIn(STUDY_NOTE_TYPES, { message: `Type must be one of: ${STUDY_NOTE_TYPES.join(', ')}` })
  type: StudyNoteType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  codeLanguage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  url?: string;
}
