import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schema/user.schema';
import { Assessment } from './assessment.schema';

export type UserAssessmentDocument = UserAssessment & Document;

@Schema({ timestamps: true, collection: 'user_assessments' })
export class UserAssessment {
  @Prop({ type: Types.ObjectId, ref: 'Assessment', required: true })
  assessmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ trim: true, required: true })
  userAnswer: string;

  @Prop({ default: 0 })
  pointsAwarded: number;

  @Prop({ default: false })
  isReviewed: boolean;

  @Prop({ default: 0 })
  totalPoints: number;

  @Prop({ trim: true, default: 'White' })
  belt: string;
}

export const UserAssessmentSchema =
  SchemaFactory.createForClass(UserAssessment);

UserAssessmentSchema.index({ userId: 1, assessmentId: 1 }, { unique: true });
UserAssessmentSchema.index({ userId: 1 });
UserAssessmentSchema.index({ assessmentId: 1 });
