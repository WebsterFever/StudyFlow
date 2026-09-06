import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePlannerSubtaskDto } from './create-planner-subtask.dto';

// `taskId` excluded — a subtask never moves to a different task after creation.
export class UpdatePlannerSubtaskDto extends PartialType(OmitType(CreatePlannerSubtaskDto, ['taskId'] as const)) {}
