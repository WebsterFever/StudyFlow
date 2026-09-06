import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreatePlannerNoteDto {
  @IsUUID(undefined, { message: 'goalId is required.' })
  goalId: string;

  @IsString()
  @MinLength(1, { message: 'Content cannot be empty.' })
  @MaxLength(20000)
  content: string;
}
