import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @IsOptional()
  @Matches(TIME_PATTERN, { message: 'quietHoursStart must be in HH:mm 24-hour format.' })
  quietHoursStart?: string | null;

  @IsOptional()
  @Matches(TIME_PATTERN, { message: 'quietHoursEnd must be in HH:mm 24-hour format.' })
  quietHoursEnd?: string | null;
}
