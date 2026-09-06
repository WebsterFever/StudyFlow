import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreatePlannerSubtaskDto {
  @IsUUID(undefined, { message: 'taskId is required.' })
  taskId: string;

  @IsString()
  @MinLength(1, { message: 'Title cannot be empty.' })
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}
