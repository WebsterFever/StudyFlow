import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { UpsertGoalDto } from '../../goals/dto/upsert-goal.dto';
import { CreateStudyItemDto } from '../../study-items/dto/create-study-item.dto';
import { CreateStudySessionDto } from '../../study-sessions/dto/create-study-session.dto';

export class ImportPayloadDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpsertGoalDto)
  goal?: UpsertGoalDto | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStudyItemDto)
  items?: CreateStudyItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStudySessionDto)
  sessions?: CreateStudySessionDto[];

  // Keyed by yyyy-mm-dd; validated defensively in DataService rather than
  // via class-validator, since the key set is dynamic per user.
  @IsOptional()
  @IsObject()
  dayOverrides?: Record<string, { unavailable: boolean; hoursOverride: number | null }>;
}
