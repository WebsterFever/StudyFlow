import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePlannerNoteDto } from './create-planner-note.dto';

// `goalId` excluded — a note never moves to a different goal after creation.
export class UpdatePlannerNoteDto extends PartialType(OmitType(CreatePlannerNoteDto, ['goalId'] as const)) {}
