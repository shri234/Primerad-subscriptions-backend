import { IsString, IsNotEmpty } from 'class-validator';

export class CreateObservationDto {
  @IsString()
  @IsNotEmpty()
  observationText: string;

  @IsString()
  @IsNotEmpty()
  module: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string; // must be a DICOM session
}
