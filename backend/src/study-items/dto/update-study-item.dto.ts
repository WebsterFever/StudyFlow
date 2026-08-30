import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { CreateStudyItemDto } from './create-study-item.dto';

// `id` is intentionally excluded — it must never be reassignable via PATCH,
// otherwise TypeORM's save() would treat the mutated entity as a different
// row (insert) instead of updating the one that was fetched.
export class UpdateStudyItemDto extends PartialType(OmitType(CreateStudyItemDto, ['id'] as const)) {
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  mastery?: number | null;
}
