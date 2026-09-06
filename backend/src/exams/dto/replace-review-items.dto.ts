import { IsArray, IsUUID } from 'class-validator';

export class ReplaceReviewItemsDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  studyItemIds: string[];
}
