import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  IsMongoId,
} from 'class-validator';
export class UpdateFacultiesDto {
  @IsArray()
  @IsMongoId({ each: true })
  facultyIds: string[];
}
