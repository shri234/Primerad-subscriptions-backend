import { IsString, IsNotEmpty } from 'class-validator';

export class UserObservationDto {
  @IsString()
  @IsNotEmpty()
  userObservation: string;
}
