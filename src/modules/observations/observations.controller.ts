import { Controller, Post, Body, Param, Get, Patch } from '@nestjs/common';
import { ObservationService } from './observations.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { FacultyObservationDto } from './dto/faculty-observation.dto';
import { UserObservationDto } from './dto/user-observation.dto';

@Controller('observations')
export class ObservationController {
  constructor(private readonly observationService: ObservationService) {}

  // Admin creates observation question
  @Post()
  create(@Body() createDto: CreateObservationDto) {
    return this.observationService.createObservation(createDto);
  }

  // Faculty adds answer
  @Patch(':id/faculty')
  addFacultyObservation(
    @Param('id') id: string,
    @Body() dto: FacultyObservationDto,
  ) {
    return this.observationService.addFacultyObservation(id, dto);
  }

  // User adds observation
  @Patch(':id/user')
  addUserObservation(@Param('id') id: string, @Body() dto: UserObservationDto) {
    return this.observationService.addUserObservation(id, dto);
  }

  // Get all observations for a session
  @Get('session/:sessionId')
  getBySession(@Param('sessionId') sessionId: string) {
    return this.observationService.getObservationsBySession(sessionId);
  }

  // Get single observation
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.observationService.getObservation(id);
  }
}
