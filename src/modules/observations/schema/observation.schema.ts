import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Session } from '../../sessions/schema/session.schema';

export type ObservationDocument = Observation & Document;

@Schema({ timestamps: true, collection: 'observations' })
export class Observation {
  @Prop({ required: true, trim: true })
  observationText: string;

  @Prop({ trim: true, default: '' })
  facultyObservation: string;

  @Prop({ type: Types.ObjectId, ref: 'Session', required: true })
  sessionId: Types.ObjectId;

  @Prop({ required: true })
  module: string;
}

export const ObservationSchema = SchemaFactory.createForClass(Observation);
