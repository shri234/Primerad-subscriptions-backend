// dto/update-module.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateModuleDto } from './create-module.dto';

export class UpdateModuleDto extends PartialType(CreateModuleDto) {
  @IsString()
  @IsOptional()
  moduleName?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
