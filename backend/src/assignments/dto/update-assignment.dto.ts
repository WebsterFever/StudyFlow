import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateAssignmentDto } from './create-assignment.dto';

// `goalId` excluded — an assignment never moves to a different goal after creation.
export class UpdateAssignmentDto extends PartialType(OmitType(CreateAssignmentDto, ['goalId'] as const)) {}
