import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Session } from '../../sessions/schema/session.schema';
import { User } from '../../user/schema/user.schema';

export type ObservationDocument = Observation & Document;

@Schema({ timestamps: true, collection: 'observations' })
export class Observation {
  // Admin-created question
  @Prop({ required: true, trim: true })
  observationText: string;

  // Faculty answer for this question
  @Prop({ trim: true, default: '' })
  facultyObservation: string;

  // DICOM session reference
  @Prop({ type: Types.ObjectId, ref: 'Session', required: true })
  sessionId: Types.ObjectId;

  // Module name or ID
  @Prop({ required: true })
  module: string;

  // Users can add multiple observations
  @Prop({
    type: [
      {
        userObservation: { type: String, trim: true },
        userId: { type: Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  userObservations: {
    userObservation: string;
    userId: Types.ObjectId;
    createdAt?: Date;
  }[];
}

export const ObservationSchema = SchemaFactory.createForClass(Observation);
