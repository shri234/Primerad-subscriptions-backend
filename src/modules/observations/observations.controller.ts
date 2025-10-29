import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
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

  @UseGuards(AuthGuard)
  @Post()
  createObservation(
    @GetUser() user: any,
    @Body() createDto: CreateObservationDto,
  ) {
    return this.observationService.createObservation(createDto);
  }

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

  @UseGuards(AuthGuard)
  @Post('submit-all-observations')
  @HttpCode(HttpStatus.OK)
  async submitUserObservations(
    @GetUser() user: any,
    @Body() body: { observations: UserObservationDto[] },
  ) {
    return this.observationService.submitUserObservations(
      user._id,
      body.observations,
    );
  }

  @UseGuards(AuthGuard)
  @Get('compare/:sessionId')
  async compareObservations(
    @Param('sessionId') sessionId: string,
    @GetUser() user: any,
  ) {
    return this.observationService.compareFacultyAndUserObservations(
      sessionId,
      user._id,
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id/dicom-video')
  async getDicomVideoUrl(@Param('id') sessionId: string) {
    const dicomVideo =
      await this.observationService.getDicomVideoUrl(sessionId);
    if (!dicomVideo) {
      throw new NotFoundException('DICOM video not found or not accessible');
    }

    return {
      success: true,
      sessionId,
      dicomVideoUrl: dicomVideo,
    };
  }

  @UseGuards(AuthGuard)
  @Get('session/:sessionId')
  getObservationsBySession(@Param('sessionId') sessionId: string) {
    return this.observationService.getObservationsBySession(sessionId);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  getObservationWithUserResponses(@Param('id') id: string) {
    return this.observationService.getObservationWithUserResponses(id);
  }

  @UseGuards(AuthGuard)
  @Get('user/me')
  getUserObservations(@GetUser() user: any) {
    return this.observationService.getUserObservations(user._id);
  }
}
