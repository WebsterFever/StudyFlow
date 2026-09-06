import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePlannerMilestoneDto } from './create-planner-milestone.dto';

// `goalId` excluded — a milestone never moves to a different goal after creation.
export class UpdatePlannerMilestoneDto extends PartialType(OmitType(CreatePlannerMilestoneDto, ['goalId'] as const)) {}
