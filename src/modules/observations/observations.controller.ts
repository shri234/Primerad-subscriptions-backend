import { Controller, Post, Body, Param, Get, Patch } from '@nestjs/common';
import { ObservationService } from './observations.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { FacultyObservationDto } from './dto/faculty-observation.dto';
import { UserObservationDto } from './dto/user-observation.dto';

@Controller('observations')
export class ObservationController {
  constructor(private readonly observationService: ObservationService) {}

  @Post()
  createObservation(@Body() createDto: CreateObservationDto) {
    return this.observationService.createObservation(createDto);
  }

  @Patch(':id/faculty')
  addFacultyObservation(
    @Param('id') id: string,
    @Body() dto: FacultyObservationDto,
  ) {
    return this.observationService.addFacultyObservation(id, dto);
  }

  @Post(':id/user')
  addUserObservation(
    @Param('id') observationId: string,
    @Body() dto: UserObservationDto,
  ) {
    return this.observationService.addUserObservation(observationId, dto);
  }

  @Get('session/:sessionId')
  getObservationsBySession(@Param('sessionId') sessionId: string) {
    return this.observationService.getObservationsBySession(sessionId);
  }

  @Get(':id  ')
  getObservationWithUserResponses(@Param('id') id: string) {
    return this.observationService.getObservationWithUserResponses(id);
  }

  @Get('user/:userId')
  getUserObservations(@Param('userId') userId: string) {
    return this.observationService.getUserObservations(userId);
  }
}
