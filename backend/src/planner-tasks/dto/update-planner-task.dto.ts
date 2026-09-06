import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePlannerTaskDto } from './create-planner-task.dto';

// `goalId` excluded — a task never moves to a different goal after creation.
export class UpdatePlannerTaskDto extends PartialType(OmitType(CreatePlannerTaskDto, ['goalId'] as const)) {}
