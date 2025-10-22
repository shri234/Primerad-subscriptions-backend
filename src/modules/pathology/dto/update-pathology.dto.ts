// dto/update-pathology.dto.ts
import { IsString, IsOptional, IsMongoId } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreatePathologyDto } from './create-pathology.dto';

export class UpdatePathologyDto extends PartialType(CreatePathologyDto) {
  @IsString()
  @IsOptional()
  pathologyName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsOptional()
  moduleId?: string;
}
