import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateFacultyDto {
  @IsString()
  name: string;

  @IsString()
  title?: string;

  @IsString()
  location: string;

  @IsString()
  country: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  specializations?: string;

  // Add other optional fields as needed
}

export class UpdateFacultyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  specializations?: string;
}
