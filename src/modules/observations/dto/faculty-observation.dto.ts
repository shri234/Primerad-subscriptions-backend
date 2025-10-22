import { IsString, IsNotEmpty } from 'class-validator';

export class FacultyObservationDto {
  @IsString()
  @IsNotEmpty()
  facultyObservation: string;
}
