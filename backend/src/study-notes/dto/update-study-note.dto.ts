import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateStudyNoteDto } from './create-study-note.dto';

// `goalId`/`studyItemId` are excluded — a note never moves to a different
// goal or item after creation, matching how UpdateStudyItemDto excludes `goalId`.
export class UpdateStudyNoteDto extends PartialType(OmitType(CreateStudyNoteDto, ['goalId', 'studyItemId'] as const)) {
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
