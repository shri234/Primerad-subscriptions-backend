import { Types } from 'mongoose';

// Re-export ISession and related types from the helper
export type {
  ISession,
  IUserAccess,
  IControlledSession,
  AccessLevel,
} from '../../../config/session-access-helper';

// Additional interfaces specific to this module
export interface IPlaybackProgress {
  userId: string | Types.ObjectId;
  sessionId: string | Types.ObjectId;
  sessionModelType: 'DicomCase' | 'RecordedLecture' | 'LiveProgram';
  currentTime: number;
  lastWatchedAt: Date;
}

export interface IUserSessionView {
  userId: string | Types.ObjectId;
  sessionId: string | Types.ObjectId;
  moduleId?: string | Types.ObjectId;
  viewCount: number;
  lastViewedAt: Date;
  isCompleted: boolean;
}
