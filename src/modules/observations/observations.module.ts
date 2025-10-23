import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ObservationService } from './observations.service';
import { ObservationController } from './observations.controller';
import { Observation, ObservationSchema } from './schema/observation.schema';
import {
  UserObservation,
  UserObservationSchema,
} from './schema/user-observation.schema';
import { Session, SessionSchema } from '../sessions/schema/session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Observation.name, schema: ObservationSchema },
      { name: UserObservation.name, schema: UserObservationSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  controllers: [ObservationController],
  providers: [ObservationService],
})
export class ObservationModule {}
