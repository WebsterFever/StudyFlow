import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { CreateStudySessionDto } from './create-study-session.dto';

export class ReplaceSessionsDto {
  @IsArray()
  @ArrayMaxSize(20000)
  @ValidateNested({ each: true })
  @Type(() => CreateStudySessionDto)
  sessions: CreateStudySessionDto[];
}
