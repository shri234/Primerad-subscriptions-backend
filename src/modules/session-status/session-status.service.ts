import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PlaybackProgress,
  PlaybackProgressDocument,
  UserSessionView,
  UserSessionViewDocument,
  Session,
  SessionDocument,
} from '../sessions/schema/session.schema';

export enum SessionStatus {
  NOT_STARTED = 'notstarted',
  IN_PROGRESS = 'inprogress',
  COMPLETED = 'completed',
}

export interface UpdatePlaybackProgressDto {
  userId: string;
  sessionId: string;
  currentTime: number;
  duration?: number; // Total video duration in seconds
}

export interface MarkDicomProgressDto {
  userId: string;
  sessionId: string;
  hasStarted?: boolean; // When user enters DICOM page
  hasSubmittedObservations?: boolean; // When observations are submitted
}

export interface SessionProgressResponse {
  status: SessionStatus;
  currentTime?: number;
  lastWatchedAt?: Date;
  completionPercentage?: number;
  isCompleted: boolean;
}

@Injectable()
export class SessionStatusService {
  private readonly logger = new Logger(SessionStatusService.name);
  private readonly COMPLETION_THRESHOLD = 0.8; // 80% completion threshold

  constructor(
    @InjectModel(PlaybackProgress.name)
    private playbackProgressModel: Model<PlaybackProgressDocument>,
    @InjectModel(UserSessionView.name)
    private userSessionViewModel: Model<UserSessionViewDocument>,
    @InjectModel(Session.name)
    private sessionModel: Model<SessionDocument>,
  ) {}

  /**
   * Update playback progress for Vimeo lectures
   * Automatically marks as completed if watched >= 80%
   */
  async updateVimeoProgress(
    dto: UpdatePlaybackProgressDto,
  ): Promise<SessionProgressResponse> {
    const { userId, sessionId, currentTime, duration } = dto;

    // Validate session exists and is Vimeo type
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (session.sessionType !== 'Vimeo') {
      throw new BadRequestException('Session is not a Vimeo lecture');
    }

    // Update or create playback progress
    const playbackProgress = await this.playbackProgressModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        sessionId: new Types.ObjectId(sessionId),
      },
      {
        $set: {
          currentTime,
          lastWatchedAt: new Date(),
          sessionModelType: 'Lecture',
        },
      },
      { upsert: true, new: true },
    );

    // Calculate completion percentage
    let completionPercentage = 0;
    let isCompleted = false;

    if (duration && duration > 0) {
      completionPercentage = (currentTime / duration) * 100;
      isCompleted = completionPercentage >= this.COMPLETION_THRESHOLD * 100;
    }

    // Update user session view
    const userSessionView = await this.userSessionViewModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        sessionId: new Types.ObjectId(sessionId),
      },
      {
        $set: {
          lastViewedAt: new Date(),
          isCompleted,
        },
        $inc: { viewCount: 0 }, // Don't increment view count on progress update
        $setOnInsert: {
          moduleId: session.moduleId,
        },
      },
      { upsert: true, new: true },
    );

    // Determine status
    let status = SessionStatus.IN_PROGRESS;
    if (isCompleted) {
      status = SessionStatus.COMPLETED;
    } else if (currentTime === 0) {
      status = SessionStatus.NOT_STARTED;
    }

    this.logger.log(
      `Vimeo progress updated: User ${userId}, Session ${sessionId}, Status: ${status}, Progress: ${completionPercentage.toFixed(2)}%`,
    );

    return {
      status,
      currentTime,
      lastWatchedAt: playbackProgress.lastWatchedAt,
      completionPercentage,
      isCompleted,
    };
  }

  /**
   * Mark DICOM case as started (when user enters the page)
   */
  async markDicomStarted(
    userId: string,
    sessionId: string,
  ): Promise<SessionProgressResponse> {
    // Validate session exists and is DICOM type
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (session.sessionType !== 'Dicom') {
      throw new BadRequestException('Session is not a DICOM case');
    }

    // Create or update playback progress to mark as started
    await this.playbackProgressModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        sessionId: new Types.ObjectId(sessionId),
      },
      {
        $set: {
          lastWatchedAt: new Date(),
          sessionModelType: 'Dicom',
        },
        $setOnInsert: {
          currentTime: 0,
        },
      },
      { upsert: true, new: true },
    );

    // Update user session view (mark as in-progress, not completed yet)
    await this.userSessionViewModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        sessionId: new Types.ObjectId(sessionId),
      },
      {
        $set: {
          lastViewedAt: new Date(),
          isCompleted: false,
        },
        $inc: { viewCount: 1 }, // Increment view count when starting
        $setOnInsert: {
          moduleId: session.moduleId,
        },
      },
      { upsert: true, new: true },
    );

    this.logger.log(
      `DICOM case started: User ${userId}, Session ${sessionId}, Status: IN_PROGRESS`,
    );

    return {
      status: SessionStatus.IN_PROGRESS,
      lastWatchedAt: new Date(),
      isCompleted: false,
    };
  }

  /**
   * Mark DICOM case as completed (when observations are submitted)
   */
  async markDicomCompleted(
    userId: string,
    sessionId: string,
  ): Promise<SessionProgressResponse> {
    // Validate session exists and is DICOM type
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (session.sessionType !== 'Dicom') {
      throw new BadRequestException('Session is not a DICOM case');
    }

    // Update playback progress
    await this.playbackProgressModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        sessionId: new Types.ObjectId(sessionId),
      },
      {
        $set: {
          lastWatchedAt: new Date(),
          sessionModelType: 'Dicom',
        },
      },
      { upsert: true },
    );

    await this.userSessionViewModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        sessionId: new Types.ObjectId(sessionId),
      },
      {
        $set: {
          lastViewedAt: new Date(),
          isCompleted: true,
        },
        $setOnInsert: {
          moduleId: session.moduleId,
          viewCount: 1,
        },
      },
      { upsert: true, new: true },
    );

    this.logger.log(
      `DICOM case completed: User ${userId}, Session ${sessionId}, Status: COMPLETED`,
    );

    return {
      status: SessionStatus.COMPLETED,
      lastWatchedAt: new Date(),
      isCompleted: true,
      completionPercentage: 100,
    };
  }

  /**
   * Get session progress for a user
   */
  async getSessionProgress(
    userId: string,
    sessionId: string,
  ): Promise<SessionProgressResponse> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const [playbackProgress, userSessionView] = await Promise.all([
      this.playbackProgressModel.findOne({
        userId: new Types.ObjectId(userId),
        sessionId: new Types.ObjectId(sessionId),
      }),
      this.userSessionViewModel.findOne({
        userId: new Types.ObjectId(userId),
        sessionId: new Types.ObjectId(sessionId),
      }),
    ]);

    if (!playbackProgress && !userSessionView) {
      return {
        status: SessionStatus.NOT_STARTED,
        isCompleted: false,
      };
    }

    if (userSessionView?.isCompleted) {
      return {
        status: SessionStatus.COMPLETED,
        currentTime: playbackProgress?.currentTime,
        lastWatchedAt: playbackProgress?.lastWatchedAt,
        completionPercentage: 100,
        isCompleted: true,
      };
    }

    // Otherwise, it's in progress
    return {
      status: SessionStatus.IN_PROGRESS,
      currentTime: playbackProgress?.currentTime,
      lastWatchedAt: playbackProgress?.lastWatchedAt,
      isCompleted: false,
    };
  }

  /**
   * Get all in-progress sessions for a user
   */
  async getInProgressSessions(userId: string): Promise<any[]> {
    const inProgressViews = await this.userSessionViewModel
      .find({
        userId: new Types.ObjectId(userId),
        isCompleted: false,
      })
      .sort({ lastViewedAt: -1 })
      .populate({
        path: 'sessionId',
        populate: { path: 'faculty', select: 'name image' },
      });

    return inProgressViews.map((view) => ({
      session: view.sessionId,
      lastViewedAt: view.lastViewedAt,
      viewCount: view.viewCount,
      status: SessionStatus.IN_PROGRESS,
    }));
  }

  /**
   * Get all completed sessions for a user
   */
  async getCompletedSessions(userId: string): Promise<any[]> {
    const completedViews = await this.userSessionViewModel
      .find({
        userId: new Types.ObjectId(userId),
        isCompleted: true,
      })
      .sort({ lastViewedAt: -1 })
      .populate({
        path: 'sessionId',
        populate: { path: 'faculty', select: 'name image' },
      });

    return completedViews.map((view) => ({
      session: view.sessionId,
      lastViewedAt: view.lastViewedAt,
      viewCount: view.viewCount,
      status: SessionStatus.COMPLETED,
    }));
  }

  /**
   * Get session statistics for a user
   */
  async getUserSessionStats(userId: string): Promise<{
    totalStarted: number;
    totalCompleted: number;
    totalInProgress: number;
    completionRate: number;
  }> {
    const [completed, inProgress] = await Promise.all([
      this.userSessionViewModel.countDocuments({
        userId: new Types.ObjectId(userId),
        isCompleted: true,
      }),
      this.userSessionViewModel.countDocuments({
        userId: new Types.ObjectId(userId),
        isCompleted: false,
      }),
    ]);

    const totalStarted = completed + inProgress;
    const completionRate =
      totalStarted > 0 ? (completed / totalStarted) * 100 : 0;

    return {
      totalStarted,
      totalCompleted: completed,
      totalInProgress: inProgress,
      completionRate: parseFloat(completionRate.toFixed(2)),
    };
  }
}
