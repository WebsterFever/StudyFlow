import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreateGoalDto } from './create-goal.dto';
import type { GoalStatus } from '../goal.entity';

export const GOAL_STATUSES: GoalStatus[] = ['active', 'completed', 'paused'];

// reminderEnabled / reminderIntervalMinutes are inherited (as optional) from
// CreateGoalDto via PartialType — only `status` is unique to updates.
export class UpdateGoalDto extends PartialType(CreateGoalDto) {
  @IsOptional()
  @IsIn(GOAL_STATUSES, { message: `Status must be one of: ${GOAL_STATUSES.join(', ')}` })
  status?: GoalStatus;
}
