import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsInt, IsOptional, IsString, IsUUID, Min, MinLength, ValidateNested } from 'class-validator';
import { MAX_FILE_COUNT } from '../project-file-rules';

export class ProjectFileInputDto {
  @IsString()
  path: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsInt()
  @Min(0)
  size: number;
}

export class CreateProjectSnapshotDto {
  @IsUUID(undefined, { message: 'goalId is required.' })
  goalId: string;

  @IsUUID(undefined, { message: 'studyItemId is required.' })
  studyItemId: string;

  @IsString()
  @MinLength(1, { message: 'Name your project snapshot.' })
  name: string;

  @ValidateNested({ each: true })
  @Type(() => ProjectFileInputDto)
  @ArrayMinSize(1, { message: 'No files to upload.' })
  @ArrayMaxSize(MAX_FILE_COUNT, { message: `A project snapshot can have at most ${MAX_FILE_COUNT} files.` })
  files: ProjectFileInputDto[];
}
