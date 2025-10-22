import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  @IsNotEmpty()
  moduleName: string;

  @IsString()
  @IsOptional()
  description?: string;
}
