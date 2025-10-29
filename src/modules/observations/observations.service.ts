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

  async addUserObservation(
    observationId: string,
    userDto: UserObservationDto,
    userId: string,
  ) {
    const observation = await this.observationModel.findById(observationId);
    if (!observation) throw new NotFoundException('Observation not found');

    const userObservation = new this.userObservationModel({
      observationId: new Types.ObjectId(observationId),
      userId: userId,
      userObservation: userDto.userObservation,
    });

    return userObservation.save();
  }

  async submitUserObservations(
    userId: string,
    observations: UserObservationDto[],
  ) {
    const obsIds = observations.map((o) => new Types.ObjectId(o.observationId));
    const dbObservations = await this.observationModel.find({
      _id: { $in: obsIds },
    });

    const userObservations = observations.map((dto) => {
      const obs = dbObservations.find(
        (o: any) => o._id.toString() === dto.observationId,
      );
      if (!obs)
        throw new NotFoundException(
          `Observation ${dto.observationId} not found`,
        );

      return {
        observationId: obs._id,
        userId,
        userObservation: dto.userObservation,
        observationText: obs.observationText,
        module: obs.module,
        sessionId: obs.sessionId,
      };
    });

    await this.userObservationModel.insertMany(userObservations);
    return {
      message: 'All user observations saved successfully',
      count: userObservations.length,
    };
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

  async compareFacultyAndUserObservations(sessionId: string, userId: string) {
    const observations = await this.observationModel.find({
      sessionId: new Types.ObjectId(sessionId),
    });

    if (!observations || observations.length === 0) {
      throw new NotFoundException('No observations found for this session');
    }

    const observationIds = observations.map((obs) => obs._id);
    const userObservations = await this.userObservationModel.find({
      observationId: { $in: observationIds },
      userId,
    });

    const result = observations.map((obs: any) => {
      const userObs = userObservations.find(
        (uo) => uo.observationId.toString() === obs._id.toString(),
      );

      return {
        observationId: obs._id,
        observationText: obs.observationText,
        module: obs.module,
        facultyObservation: obs.facultyObservation || '',
        userObservation: userObs ? userObs.userObservation : '',
      };
    });

    return {
      count: result.length,
      comparisons: result,
    };
  }

  async getUserObservations(userId: string) {
    return this.userObservationModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('observationId', 'observationText module');
  }

  async getDicomVideoUrl(sessionId: string): Promise<string | null> {
    const session = await this.sessionModel
      .findById(new Types.ObjectId(sessionId))
      .lean();

    if (!session) throw new NotFoundException('Session not found');

    if (session.sessionType !== 'Dicom') {
      return null;
    }

    return session.dicomVideoUrl || null;
  }
}
