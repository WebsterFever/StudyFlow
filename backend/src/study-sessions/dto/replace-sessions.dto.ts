import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { CreateStudySessionDto } from './create-study-session.dto';

export class ReplaceSessionsDto {
  // Which goal's session list this replaces — every session in the array
  // must belong to an item within this goal (verified server-side).
  @IsUUID()
  goalId: string;

  @IsArray()
  @ArrayMaxSize(20000)
  @ValidateNested({ each: true })
  @Type(() => CreateStudySessionDto)
  sessions: CreateStudySessionDto[];
}
