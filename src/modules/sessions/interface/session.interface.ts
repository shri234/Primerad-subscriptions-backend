import { Types } from 'mongoose';
import { ISession } from '../../../config/session-access-helper';

export type {
  ISession,
  IUserAccess,
  IControlledSession,
  AccessLevel,
} from '../../../config/session-access-helper';

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

export type ISessionWithRating = ISession & {
  avgRating?: number;
  reviewCount?: number;
};
