import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsNotEmpty({ message: 'Mobile number is required' })
  @IsString()
  @Matches(/^\d{10}$/, { message: 'Mobile number must be a 10-digit number' })
  mobileNumber: string;

  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Designation must be at least 2 characters long' })
  designation?: string;

  @IsOptional()
  @IsEnum(['user', 'admin', 'faculty'], {
    message: 'Role must be either user, admin, or faculty',
  })
  role?: string;

  @IsNotEmpty({ message: 'OTP is required for registration' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit number' })
  otp: string;
}
