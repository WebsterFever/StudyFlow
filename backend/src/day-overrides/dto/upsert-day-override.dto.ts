import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpsertDayOverrideDto {
  @IsBoolean()
  unavailable: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Daily study hours cannot be negative.' })
  hoursOverride?: number | null;
}
