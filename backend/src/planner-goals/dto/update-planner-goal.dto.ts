import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreatePlannerGoalDto } from './create-planner-goal.dto';
import { PLANNER_GOAL_STATUSES, type PlannerGoalStatus } from '../planner-goal.entity';

export class UpdatePlannerGoalDto extends PartialType(CreatePlannerGoalDto) {
  @IsOptional()
  @IsIn(PLANNER_GOAL_STATUSES, { message: `Status must be one of: ${PLANNER_GOAL_STATUSES.join(', ')}` })
  status?: PlannerGoalStatus;
}
