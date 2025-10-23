import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Observation, ObservationDocument } from './schema/observation.schema';
import {
  UserObservation,
  UserObservationDocument,
} from './schema/user-observation.schema';
import { Session, SessionDocument } from '../sessions/schema/session.schema';
import { CreateObservationDto } from './dto/create-observation.dto';
import { FacultyObservationDto } from './dto/faculty-observation.dto';
import { UserObservationDto } from './dto/user-observation.dto';

@Injectable()
export class ObservationService {
  constructor(
    @InjectModel(Observation.name)
    private observationModel: Model<ObservationDocument>,
    @InjectModel(UserObservation.name)
    private userObservationModel: Model<UserObservationDocument>,
    @InjectModel(Session.name)
    private sessionModel: Model<SessionDocument>,
  ) {}

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

  async addFacultyObservation(id: string, facultyDto: FacultyObservationDto) {
    const obs = await this.observationModel.findById(id);
    if (!obs) throw new NotFoundException('Observation not found');

    obs.facultyObservation = facultyDto.facultyObservation;
    return obs.save();
  }

  async addUserObservation(observationId: string, userDto: UserObservationDto) {
    const observation = await this.observationModel.findById(observationId);
    if (!observation) throw new NotFoundException('Observation not found');

    const userObservation = new this.userObservationModel({
      observationId: new Types.ObjectId(observationId),
      userId: new Types.ObjectId(userDto.userId),
      userObservation: userDto.userObservation,
    });

    return userObservation.save();
  }

  async getObservationsBySession(sessionId: string) {
    return this.observationModel.find({
      sessionId: new Types.ObjectId(sessionId),
    });
  }

  async getObservationWithUserResponses(observationId: string) {
    const observation = await this.observationModel.findById(observationId);
    if (!observation) throw new NotFoundException('Observation not found');

    const userResponses = await this.userObservationModel
      .find({ observationId: new Types.ObjectId(observationId) })
      .populate('userId', 'name email');

    return {
      ...observation.toObject(),
      userResponses,
    };
  }

  async getUserObservations(userId: string) {
    return this.userObservationModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('observationId', 'observationText module');
  }
}
