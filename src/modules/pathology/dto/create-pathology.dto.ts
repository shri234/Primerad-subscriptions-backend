import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class CreatePathologyDto {
  @IsString()
  @IsNotEmpty()
  pathologyName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsNotEmpty()
  moduleId: string;
}
