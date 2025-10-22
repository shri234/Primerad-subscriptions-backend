import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Observation, ObservationDocument } from './schema/observation.schema';
import { Session, SessionDocument } from '../sessions/schema/session.schema';
import { CreateObservationDto } from './dto/create-observation.dto';
import { FacultyObservationDto } from './dto/faculty-observation.dto';
import { UserObservationDto } from './dto/user-observation.dto';

@Injectable()
export class ObservationService {
  constructor(
    @InjectModel(Observation.name)
    private observationModel: Model<ObservationDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  // Admin creates observation question
  async createObservation(createDto: CreateObservationDto) {
    const session = await this.sessionModel.findById(createDto.sessionId);
    if (!session) throw new BadRequestException('Session not found');
    if (session.sessionType !== 'Dicom')
      throw new BadRequestException(
        'Observations can only be added to DICOM sessions',
      );

    const observation = new this.observationModel({
      observationText: createDto.observationText,
      module: createDto.module,
      sessionId: new Types.ObjectId(createDto.sessionId),
    });

    return observation.save();
  }

  // Faculty adds answer
  async addFacultyObservation(id: string, facultyDto: FacultyObservationDto) {
    const obs = await this.observationModel.findById(id);
    if (!obs) throw new NotFoundException('Observation question not found');

    obs.facultyObservation = facultyDto.facultyObservation;
    return obs.save();
  }

  // User adds their observation
  async addUserObservation(id: string, userDto: UserObservationDto) {
    const obs = await this.observationModel.findById(id);
    if (!obs) throw new NotFoundException('Observation question not found');

    obs.userObservations.push({
      userObservation: userDto.userObservation,
      userId: new Types.ObjectId(userDto.userId),
      createdAt: new Date(),
    });
    return obs.save();
  }

  // Get all observations for a session
  async getObservationsBySession(sessionId: string) {
    return this.observationModel.find({
      sessionId: new Types.ObjectId(sessionId),
    });
  }

  // Get single observation by ID
  async getObservation(id: string) {
    return this.observationModel.findById(id);
  }
}
