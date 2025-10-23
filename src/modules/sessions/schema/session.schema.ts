import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({
  timestamps: true,
  collection: 'sessions',
})
export class Session {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop()
  moduleName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Module' })
  moduleId?: Types.ObjectId;

  @Prop()
  pathologyName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Pathology' })
  pathologyId?: Types.ObjectId;

  @Prop()
  difficulty?: string;

  @Prop({ default: false })
  isFree?: boolean;

  @Prop({ default: false })
  sponsored?: boolean;

  @Prop()
  imageUrl_1920x1080?: string;

  @Prop()
  imageUrl_522x760?: string;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  startTime?: string;

  @Prop()
  endTime?: string;

  @Prop({ type: [String] })
  resourceLinks?: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Faculty' }] })
  faculty?: Types.ObjectId[];

  @Prop({
    required: true,
    enum: ['Dicom', 'Vimeo', 'Zoom', 'Live', 'Assessment'],
  })
  sessionType: string;

  @Prop()
  isAssessment?: boolean;

  @Prop()
  dicomStudyId?: string;

  @Prop()
  dicomCaseId?: string;

  @Prop()
  dicomCaseVideoUrl?: string;

  @Prop()
  caseAccessType?: string;

  @Prop()
  sessionDuration?: string;

  @Prop()
  vimeoVideoId?: string;

  @Prop()
  videoUrl?: string;

  @Prop()
  videoType?: string;

  @Prop()
  zoomMeetingId?: string;

  @Prop()
  zoomPassword?: string;

  @Prop()
  zoomJoinUrl?: string;

  @Prop()
  zoomBackUpLink?: string;

  @Prop()
  vimeoLiveUrl?: string;

  @Prop()
  liveProgramType?: string;

  @Prop({ type: Number, default: 0 })
  averageRating: number;

  @Prop({ type: Number, default: 0 })
  numOfReviews: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ sessionType: 1 });
SessionSchema.index({ pathologyId: 1 });
SessionSchema.index({ moduleId: 1 });
SessionSchema.index({ difficulty: 1 });
SessionSchema.index({ isFree: 1 });
SessionSchema.index({ createdAt: -1 });
SessionSchema.index({ startDate: 1 });
SessionSchema.index({ faculty: 1 });

SessionSchema.index({ sessionType: 1, pathologyId: 1 });
SessionSchema.index({ sessionType: 1, createdAt: -1 });
SessionSchema.index({ isFree: 1, sessionType: 1 });

/**
 * PlaybackProgress Schema
 * Tracks user progress for video sessions
 */
export type PlaybackProgressDocument = PlaybackProgress & Document;

@Schema({ timestamps: true })
export class PlaybackProgress {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Session' })
  sessionId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['DicomCase', 'RecordedLecture', 'LiveProgram'],
  })
  sessionModelType: string;

  @Prop({ default: 0 })
  currentTime: number;

  @Prop({ default: Date.now })
  lastWatchedAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PlaybackProgressSchema =
  SchemaFactory.createForClass(PlaybackProgress);

PlaybackProgressSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
PlaybackProgressSchema.index({ userId: 1, lastWatchedAt: -1 });
PlaybackProgressSchema.index({ sessionId: 1 });

export type UserSessionViewDocument = UserSessionView & Document;

@Schema({ timestamps: true })
export class UserSessionView {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Session' })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Module' })
  moduleId?: Types.ObjectId;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: Date.now })
  lastViewedAt: Date;

  @Prop({ default: false })
  isCompleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSessionViewSchema =
  SchemaFactory.createForClass(UserSessionView);

// Indexes for efficient queries
UserSessionViewSchema.index({ userId: 1, sessionId: 1 });
UserSessionViewSchema.index({ sessionId: 1 });
UserSessionViewSchema.index({ userId: 1, isCompleted: 1 });
UserSessionViewSchema.index({ sessionId: 1, viewCount: -1 });
UserSessionViewSchema.index({ userId: 1, lastViewedAt: -1 });
