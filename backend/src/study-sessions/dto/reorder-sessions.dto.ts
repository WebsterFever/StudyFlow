import { ArrayMinSize, IsArray, IsDateString, IsUUID } from 'class-validator';

export class ReorderSessionsDto {
  @IsDateString()
  date: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  orderedIds: string[];
}
