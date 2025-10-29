import { IsString, IsNotEmpty } from 'class-validator';

export class UserObservationDto {
  @IsString()
  @IsNotEmpty()
  observationId: string;

  @IsString()
  @IsNotEmpty()
  userObservation: string;
}
