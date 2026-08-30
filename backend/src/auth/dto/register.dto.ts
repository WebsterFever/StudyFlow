import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(1, { message: 'Name is required.' })
  @MaxLength(255)
  name: string;

  @IsEmail({}, { message: 'A valid email address is required.' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(72, { message: 'Password must be at most 72 characters.' })
  password: string;

  @IsString()
  confirmPassword: string;
}
