import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';
import { CreateStudyItemDto } from './create-study-item.dto';

export class BulkCreateStudyItemsDto {
  @ValidateNested({ each: true })
  @Type(() => CreateStudyItemDto)
  @ArrayMinSize(1, { message: 'Provide at least one item.' })
  items: CreateStudyItemDto[];
}
