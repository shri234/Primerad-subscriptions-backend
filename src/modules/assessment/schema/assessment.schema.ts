import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Session } from '../../sessions/schema/session.schema';

export type AssessmentDocument = Assessment & Document;

@Schema({ timestamps: true, collection: 'assessments' })
export class Assessment {
  @Prop({ required: true, trim: true })
  questionText: string;

  @Prop({ trim: true, default: '' })
  facultyAnswer: string;

  @Prop({ type: Types.ObjectId, ref: 'Session', required: true })
  sessionId: Types.ObjectId;

  @Prop({ required: true })
  module: string;

  @Prop({ default: 10 })
  maxPoints: number;
}

export const AssessmentSchema = SchemaFactory.createForClass(Assessment);

AssessmentSchema.index({ sessionId: 1 });
AssessmentSchema.index({ module: 1 });
