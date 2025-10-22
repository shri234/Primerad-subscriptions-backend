import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  IsMongoId,
} from 'class-validator';
export class AIComparisonDto {
  @IsString()
  userObservations: string;

  @IsString()
  facultyObservations: string;
}
