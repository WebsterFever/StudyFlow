import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateExamDto } from './create-exam.dto';

// `goalId` excluded — an exam never moves to a different goal after creation.
export class UpdateExamDto extends PartialType(OmitType(CreateExamDto, ['goalId'] as const)) {}
