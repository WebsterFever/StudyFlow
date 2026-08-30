import { OmitType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from 'class-validator';
import type { DailyHours, GoalStatus } from '../../goals/goal.entity';
import { GOAL_STATUSES } from '../../goals/dto/update-goal.dto';
import { CreateStudyItemDto } from '../../study-items/dto/create-study-item.dto';
import { CreateStudySessionDto } from '../../study-sessions/dto/create-study-session.dto';

// Same shape as CreateStudyItemDto but without goalId — the goal a bundled
// item belongs to is always the bundle it's nested in, assigned server-side.
export class BundledItemDto extends OmitType(CreateStudyItemDto, ['goalId'] as const) {}

export class GoalBundleDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(1, { message: 'Goal name cannot be empty.' })
  @MaxLength(255)
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  deadline: string;

  @IsObject()
  dailyHours: DailyHours;

  @IsOptional()
  @IsIn(GOAL_STATUSES)
  status?: GoalStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundledItemDto)
  items?: BundledItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStudySessionDto)
  sessions?: CreateStudySessionDto[];

  // Keyed by yyyy-mm-dd; validated defensively in DataService rather than
  // via class-validator, since the key set is dynamic per goal.
  @IsOptional()
  @IsObject()
  dayOverrides?: Record<string, { unavailable: boolean; hoursOverride: number | null }>;
}

export class ImportPayloadDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoalBundleDto)
  goals?: GoalBundleDto[];

  // --- Legacy (pre-multi-goal) single-goal shape, still accepted so the
  // one-time localStorage migration keeps working for browsers that have
  // old `studyflow_v1` data. DataService normalizes this into `goals`. ---
  @IsOptional()
  @ValidateNested()
  @Type(() => GoalBundleDto)
  goal?: GoalBundleDto | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundledItemDto)
  items?: BundledItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStudySessionDto)
  sessions?: CreateStudySessionDto[];

  @IsOptional()
  @IsObject()
  dayOverrides?: Record<string, { unavailable: boolean; hoursOverride: number | null }>;
}
