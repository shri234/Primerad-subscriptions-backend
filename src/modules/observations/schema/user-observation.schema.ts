import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Observation } from './observation.schema';
import { User } from '../../user/schema/user.schema';

export type UserObservationDocument = UserObservation & Document;

@Schema({ timestamps: true, collection: 'user_observations' })
export class UserObservation {
  @Prop({ type: Types.ObjectId, ref: 'Observation', required: true })
  observationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ trim: true, required: true })
  userObservation: string;
}

export const UserObservationSchema =
  SchemaFactory.createForClass(UserObservation);
