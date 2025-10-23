import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ObservationService } from './observations.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { FacultyObservationDto } from './dto/faculty-observation.dto';
import { UserObservationDto } from './dto/user-observation.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserDocument } from '../user/schema/user.schema';

@Controller('observations')
export class ObservationController {
  constructor(private readonly observationService: ObservationService) {}

  // ✅ Create a new observation
  @UseGuards(AuthGuard)
  @Post()
  createObservation(
    @GetUser() user: any,
    @Body() createDto: CreateObservationDto,
  ) {
    return this.observationService.createObservation(createDto);
  }

  // ✅ Faculty adds observation notes
  @UseGuards(AuthGuard)
  @Patch(':id/faculty')
  addFacultyObservation(
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() dto: FacultyObservationDto,
  ) {
    return this.observationService.addFacultyObservation(id, dto);
  }

  @UseGuards(AuthGuard)
  @Post(':id/user')
  addUserObservation(
    @GetUser() user: any,
    @Param('id') observationId: string,
    @Body() dto: UserObservationDto,
  ) {
    return this.observationService.addUserObservation(
      observationId,
      dto,
      user._id,
    );
  }

  // ✅ Get all observations for a session
  @UseGuards(AuthGuard)
  @Get('session/:sessionId')
  getObservationsBySession(@Param('sessionId') sessionId: string) {
    return this.observationService.getObservationsBySession(sessionId);
  }

  // ✅ Get single observation with responses
  @UseGuards(AuthGuard)
  @Get(':id')
  getObservationWithUserResponses(@Param('id') id: string) {
    return this.observationService.getObservationWithUserResponses(id);
  }

  // ✅ Get all observations for logged-in user
  @UseGuards(AuthGuard)
  @Get('user/me')
  getUserObservations(@GetUser() user: any) {
    return this.observationService.getUserObservations(user._id);
  }
}
