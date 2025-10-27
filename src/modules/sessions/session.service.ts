import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import sharp from 'sharp';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { applySessionAccessControl } from '../../config/session-access-helper';
import { IUserAccess } from './interface/session.interface';
import { Session, SessionDocument } from './schema/session.schema';
import {Review, ReviewDocument} from '../review/schema/review.schema'
import type { Express } from 'express';
import {
  PlaybackProgress,
  PlaybackProgressDocument,
} from './schema/session.schema';
import {
  UserSessionView,
  UserSessionViewDocument,
} from './schema/session.schema';
import { ISessionWithRating,ISession } from './interface/session.interface';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly openai: OpenAI;

  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel('Pathology') private pathologyModel: Model<any>,
    @InjectModel(PlaybackProgress.name)
    private playbackProgressModel: Model<PlaybackProgressDocument>,
    @InjectModel(UserSessionView.name)
    private userSessionViewModel: Model<UserSessionViewDocument>,
    @InjectModel(Review.name)
    private reviewModel: Model<ReviewDocument>,
    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async validateAspectRatio(
    imagePath: string,
    width: number,
    height: number,
  ): Promise<boolean> {
    try {
      const metadata = await sharp(imagePath).metadata();
      return (
        Math.abs(metadata.width! / metadata.height! - width / height) < 0.01
      );
    } catch (err) {
      this.logger.error('Error validating image aspect ratio:', err);
      return false;
    }
  }

  async createSession(
    createSessionDto: CreateSessionDto,
    files: {
      image1920x1080?: Express.Multer.File[];
      image522x760?: Express.Multer.File[];
    },
  ): Promise<any> {
    const pathology = createSessionDto.pathologyId
      ? await this.pathologyModel.findById(createSessionDto.pathologyId)
      : null;

    let imageUrl_1920x1080 = files?.image1920x1080?.[0]
      ? `/uploads/${files.image1920x1080[0].filename}`
      : createSessionDto.imageUrl_1920x1080 || null;

    let imageUrl_522x760 = files?.image522x760?.[0]
      ? `/uploads/${files.image522x760[0].filename}`
      : createSessionDto.imageUrl_522x760 || null;

    if (files?.image1920x1080?.[0]) {
      const filePath = `uploads/${files.image1920x1080[0].filename}`;
      const isValid = await this.validateAspectRatio(filePath, 1920, 1080);
      if (!isValid) {
        fs.unlinkSync(filePath);
        throw new BadRequestException(
          'Image 1920x1080 must have aspect ratio 16:9 (1920x1080)',
        );
      }
    }

    if (files?.image522x760?.[0]) {
      const filePath = `uploads/${files.image522x760[0].filename}`;
      const isValid = await this.validateAspectRatio(filePath, 522, 760);
      if (!isValid) {
        fs.unlinkSync(filePath);
        throw new BadRequestException(
          'Image 522x760 must have aspect ratio 522:760',
        );
      }
    }

    const commonSessionData = {
      title: createSessionDto.title,
      description: createSessionDto.description,
      moduleName: createSessionDto.moduleName,
      moduleId: createSessionDto.moduleId,
      pathologyName: pathology?.pathologyName || createSessionDto.pathologyName,
      pathologyId: createSessionDto.pathologyId,
      difficulty: createSessionDto.difficulty,
      isFree: createSessionDto.isFree,
      sponsored: createSessionDto.sponsored,
      imageUrl_1920x1080,
      imageUrl_522x760,
      startDate: createSessionDto.startDate,
      endDate: createSessionDto.endDate,
      startTime: createSessionDto.startTime,
      endTime: createSessionDto.endTime,
      resourceLinks: createSessionDto.resourceLinks,
      faculty: createSessionDto.faculty,
    };

    if (createSessionDto.sessionType?.trim() === 'Dicom') {
      const dicomData = {
        ...commonSessionData,
        isAssessment: createSessionDto.isAssessment,
        dicomStudyId: createSessionDto.dicomStudyId,
        dicomCaseId: createSessionDto.dicomCaseId,
        dicomCaseVideoUrl: createSessionDto.dicomCaseVideoUrl,
        caseAccessType: createSessionDto.caseAccessType,
        sessionType: 'Dicom',
      };
      return await this.sessionModel.create(dicomData);
    } else if (createSessionDto.sessionType?.trim() === 'Vimeo') {
      const recordedData = {
        ...commonSessionData,
        sessionDuration: createSessionDto.sessionDuration,
        vimeoVideoId: createSessionDto.vimeoVideoId,
        videoUrl: createSessionDto.videoUrl,
        videoType: createSessionDto.videoType,
        sessionType: 'Vimeo',
        isAssessment: createSessionDto.isAssessment,
      };
      return await this.sessionModel.create(recordedData);
    } else if (
      createSessionDto.sessionType?.trim() === 'Zoom' ||
      createSessionDto.sessionType?.trim() === 'Live'
    ) {
      const liveProgramData = {
        ...commonSessionData,
        sessionType: 'Live',
        liveProgramType: createSessionDto.liveProgramType,
        zoomMeetingId: createSessionDto.zoomMeetingId,
        zoomPassword: createSessionDto.zoomPassword,
        zoomJoinUrl: createSessionDto.zoomJoinUrl,
        zoomBackUpLink: createSessionDto.zoomBackUpLink,
        vimeoVideoId: createSessionDto.vimeoVideoId,
        vimeoLiveUrl: createSessionDto.vimeoLiveUrl,
      };
      return await this.sessionModel.create(liveProgramData);
    }

    throw new BadRequestException('Invalid session type');
  }

  async getSessions(
    sessionType: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    const pageNum = Math.max(page, 1);
    const limitNum = Math.max(limit, 1);
    const skip = (pageNum - 1) * limitNum;

    const populateFacultyQuery = { path: 'faculty', select: 'name image' };

    let sessions: any[];
    let totalCount: number;

    if (sessionType === 'All') {
      sessions = await this.sessionModel
        .find({})
        .populate(populateFacultyQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
      totalCount = await this.sessionModel.countDocuments({});
    } else {
      const filter = { sessionType };
      sessions = await this.sessionModel
        .find(filter)
        .populate(populateFacultyQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
      totalCount = await this.sessionModel.countDocuments(filter);
    }

    const data = { sessions, totalCount, page: pageNum, limit: limitNum };
    data.sessions = this.appendImageDomainToMany(data.sessions);
    return data;
  }


async getTopRatedCases(
  limit: number | string,
  userAccess: IUserAccess,
): Promise<any> {
  const populateFacultyQuery = { path: 'faculty', select: 'name image' };
  const limitNum = limit === 'All' ? null : (parseInt(limit as string, 10) || 10);
  
  type RatedAgg = {
    _id: Types.ObjectId;
    avgRating: number;
    reviewCount: number;
    lastReviewAt: Date;
  };

  const rated: RatedAgg[] = await this.reviewModel.aggregate([
    {
      $lookup: {
        from: 'sessions',
        localField: 'sessionId',
        foreignField: '_id',
        as: 'session',
      },
    },
    { $unwind: '$session' },
    { $match: { 'session.sessionType': 'Dicom' } },
    {
      $group: {
        _id: '$sessionId',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
        lastReviewAt: { $max: '$createdAt' },
      },
    },
    { $sort: { avgRating: -1, reviewCount: -1, lastReviewAt: -1 } },
    ...(limitNum ? [{ $limit: limitNum }] : []),
  ]);

  const ratedIds = rated.map((r) => r._id);

  const ratedSessions = await this.sessionModel
    .find({ _id: { $in: ratedIds }, sessionType: 'Dicom' })
    .populate(populateFacultyQuery)
    .lean();

  const byId = new Map(
    ratedSessions.map((s) => [s._id.toString(), s]),
  );

  // let ordered: ISessionWithRating[] = rated
  //   .map((r) => {
  //     const s = byId.get(r._id.toString());
  //     if (!s) return null;
  //     return {
  //       ...s,
  //       avgRating: Math.round((r.avgRating ?? 0) * 100) / 100,
  //       reviewCount: r.reviewCount ?? 0,
  //     } as ISessionWithRating;
  //   })
  //   .filter((x): x is ISessionWithRating => Boolean(x));

  // 3) Optionally fill with unrated sessions to reach desired limit
  // const need = (limitNum ?? Number.POSITIVE_INFINITY) - ordered.length;
  // if (need > 0) {
  //   const unrated = await this.sessionModel
  //     .find({ _id: { $nin: ratedIds }, sessionType: 'Dicom' })
  //     .populate(populateFacultyQuery)
  //     .sort({ createdAt: -1 })
  //     .limit(limitNum ? need : 0)
  //     .lean();

  //   const unratedWithMetrics: ISessionWithRating[] = unrated.map((s) => ({
  //     ...s,
  //     avgRating: 0,
  //     reviewCount: 0,
  //   }));

  //   ordered = [...ordered, ...unratedWithMetrics];
  // }

  // // 4) Apply access control (update its signature to accept ISessionLean[])
  // const gated = applySessionAccessControl(
  //   ordered as unknown as ISessionLean[], // ideally update applySessionAccessControl types
  //   userAccess,
  //   2,
  // );

  return this.appendImageDomainToMany(ratedSessions);
}


  async getTopRatedLectures(userAccess: IUserAccess): Promise<any> {
    const populateFacultyQuery = { path: 'faculty', select: 'name image' };
    const lectures = await this.sessionModel
      .find({ sessionType: 'Vimeo' })
      .populate(populateFacultyQuery)
      .sort({ createdAt: -1 })
      .limit(12);

    const lecturesData = lectures.map((l) => l.toObject() as ISession);
    const processed = applySessionAccessControl(lecturesData, userAccess, 2);

    return this.appendImageDomainToMany(processed);
  }

  async getRecentItems(userAccess: IUserAccess): Promise<any> {
    const populateFacultyQuery = { path: 'faculty', select: 'name image' };

    const [getDicomCases, getRecordedLectures, getLivePrograms] =
      await Promise.all([
        this.sessionModel
          .find({ sessionType: 'Dicom' })
          .populate(populateFacultyQuery)
          .sort({ createdAt: -1 })
          .limit(8),
        this.sessionModel
          .find({ sessionType: 'Vimeo' })
          .populate(populateFacultyQuery)    
          .sort({ createdAt: -1 })
          .limit(7),
        this.sessionModel
          .find({ sessionType: 'Live' })
          .populate(populateFacultyQuery)
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

    const sessions: ISession[] = [
      ...getDicomCases.map((s) => s.toObject() as ISession),
      ...getRecordedLectures.map((s) => s.toObject() as ISession),
      ...getLivePrograms.map((s) => s.toObject() as ISession),
    ];

    sessions.sort((a, b) => {
      const timeA = a.createdAt ? a.createdAt.getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.getTime() : 0;
      return timeB - timeA;
    });

    const processed = applySessionAccessControl(sessions, userAccess, 2);
    return this.appendImageDomainToMany(processed);
  }

async getSessionsByDifficulty(
  pathologyId: string,
  page: number,
  limit: number,
  userAccess: IUserAccess | null, 
): Promise<any> {
  const pageNum = Math.max(page, 1);
  const limitNum = Math.max(limit, 1);
  const skip = (pageNum - 1) * limitNum;

  const populateFacultyQuery = { path: 'faculty', select: 'name image' };
  const difficultyFilter = { pathologyId:new Types.ObjectId(pathologyId) };

  const allSessions = await this.sessionModel
    .find(difficultyFilter)
    .populate(populateFacultyQuery)
    .sort({ createdAt: -1 });

  const dicomCount = allSessions.filter((s) => s.sessionType === 'Dicom').length;
  const recordedCount = allSessions.filter((s) => s.sessionType === 'Vimeo').length;
  const liveCount = allSessions.filter((s) => s.sessionType === 'Live').length;

  const combinedSessions: ISession[] = allSessions.map(
    (s) => s.toObject() as ISession,
  );

  combinedSessions.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  let filteredSessions: ISession[];
  if (userAccess) {
    filteredSessions = applySessionAccessControl(
  combinedSessions,
  userAccess,
  2,
) as unknown as ISession[];

  } else {
    filteredSessions = combinedSessions.slice(0, 3);
  }

  const totalCount = filteredSessions.length;
  const paginatedSessions = filteredSessions.slice(skip, skip + limitNum);

  const data = {
    sessions: paginatedSessions,
    totalCount: filteredSessions.length,
    page: pageNum,
    limit: limitNum,
    breakdown: { dicomCount, recordedCount, liveCount },
  };

  // ✅ Apply image domain to all sessions before returning
  data.sessions = this.appendImageDomainToMany(data.sessions);

  return data;

}


  async getTopWatchedSessions(userAccess: IUserAccess): Promise<any> {
    const topSessions = await this.userSessionViewModel.aggregate([
      { $group: { _id: '$sessionId', totalViews: { $sum: '$viewCount' } } },
      { $sort: { totalViews: -1 } },
      { $limit: 15 },
    ]);

    const sessionIds = topSessions.map((s) => s._id);
    const populateFacultyQuery = { path: 'faculty', select: 'name image' };

    const sessions = await this.sessionModel
      .find({ _id: { $in: sessionIds } })
      .populate(populateFacultyQuery);

    const sessionMap: Record<string, any> = {};
    sessions.forEach((session) => {
      const id = session._id?.toString();
      if (id) {
        sessionMap[id] = session;
      }
    });

    const result = topSessions
      .map((item) => {
        const sessionDoc = sessionMap[item._id.toString()];
        if (!sessionDoc) return null;

        return {
          ...sessionDoc.toObject(),
          totalViews: item.totalViews,
        } as ISession;
      })
      .filter(Boolean) as ISession[];

    return applySessionAccessControl(result, userAccess, 2);
  }

async getRecommendedSessions(
  userAccess: IUserAccess | null,
  userId: string,
  limit: number = 10,
): Promise<any> {
  const watchedViews = await this.userSessionViewModel
    .find({ userId })
    .sort({ lastViewedAt: -1 })
    .limit(20);

  // safe fallback user access object
  const safeUserAccess: IUserAccess = userAccess ?? {
    isLoggedIn: false,
    isSubscribed: false,
  };

  if (!watchedViews.length) {
    const fallbackDocs = await this.sessionModel
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit);

    const fallback = fallbackDocs.map((doc) => doc.toObject() as ISession);
    const processed = applySessionAccessControl(fallback, safeUserAccess, 2);
    return this.appendImageDomainToMany(processed);
  }

  const watchedSessionIds = watchedViews.map((v) => v.sessionId);

  const watchedSessionsDocs = await this.sessionModel.find({
    _id: { $in: watchedSessionIds },
  });

  const watchedSessions = watchedSessionsDocs.map(
    (doc) => doc.toObject() as ISession,
  );

  const pathologyIds = watchedSessions.map((s) => s.pathologyId).filter(Boolean);
  const difficultyLevels = watchedSessions.map((s) => s.difficulty).filter(Boolean);
  const facultyIds = watchedSessions.flatMap((s) => s.faculty || []).filter(Boolean);

  const query: any = {
    _id: { $nin: watchedSessionIds },
    $or: [
      { pathologyId: { $in: pathologyIds } },
      { difficulty: { $in: difficultyLevels } },
      { faculty: { $in: facultyIds } },
    ],
  };

  const populateFacultyQuery = { path: 'faculty', select: 'name image' };

  const recommendedDocs = await this.sessionModel
    .find(query)
    .populate(populateFacultyQuery)
    .sort({ createdAt: -1 })
    .limit(limit);

  const recommended = recommendedDocs.map(
    (doc) => doc.toObject() as ISession,
  );

  const processed = applySessionAccessControl(recommended, safeUserAccess, 2);
  return this.appendImageDomainToMany(processed);
}


async getWatchedSessions(
  userId: string,
  sessionTypeFilter?: string,
  limit: number = 50,
): Promise<any> {
  const playbackProgressQuery: any = { userId:new Types.ObjectId(userId) };
  if (sessionTypeFilter && sessionTypeFilter !== 'All') {
    let modelType: string | undefined;

    if (sessionTypeFilter === 'Dicom') modelType = 'Dicom';
    else if (sessionTypeFilter === 'Vimeo') modelType = 'Lecture';
    else if (sessionTypeFilter === 'Live') modelType = 'Live';

    if (modelType) playbackProgressQuery.sessionModelType = modelType;
  }
  const playbackProgress = await this.playbackProgressModel
    .find(playbackProgressQuery)
    .sort({ lastWatchedAt: -1 })
    .limit(limit);

  if (playbackProgress.length === 0) {
    return [];
  }
 
  const sessionIds = playbackProgress.map((p) => p.sessionId);
  const populateFacultyQuery = { path: 'faculty', select: 'name image' };

  const sessions = await this.sessionModel
    .find({ _id: { $in: sessionIds } })
    .populate(populateFacultyQuery);

  const sessionMap: Record<string, any> = {};
  sessions.forEach((session) => {
    const id = session._id?.toString();
    if (id) {
      sessionMap[id] = session;
    }
  });

  return playbackProgress
    .map((progress) => {
      const session = sessionMap[progress.sessionId.toString()];
      if (!session) return null;

      let sessionTypeName: string;
      if (progress.sessionModelType === 'Dicom') sessionTypeName = 'Dicom';
      else if (progress.sessionModelType === 'Lecture')
        sessionTypeName = 'Vimeo';
      else if (progress.sessionModelType === 'Live')
        sessionTypeName = 'Live';
      else sessionTypeName = 'Unknown';

      return {
        ...session.toObject(),
        playbackProgress: {
          currentTime: progress.currentTime,
          lastWatchedAt: progress.lastWatchedAt,
          sessionModelType: progress.sessionModelType,
          progressId: progress._id,
        },
        sessionType: sessionTypeName,
      };
    })
    .filter(Boolean);
}


  async updateSession(
    sessionId: string,
    sessionType: string,
    updateSessionDto: UpdateSessionDto,
    files: {
      image1920x1080?: Express.Multer.File[];
      image522x760?: Express.Multer.File[];
    },
  ): Promise<any> {
    let imageUrl_1920x1080 = files?.image1920x1080?.[0]
      ? `/uploads/${files.image1920x1080[0].filename}`
      : updateSessionDto.imageUrl_1920x1080 || null;

    let imageUrl_522x760 = files?.image522x760?.[0]
      ? `/uploads/${files.image522x760[0].filename}`
      : updateSessionDto.imageUrl_522x760 || null;

    if (files?.image1920x1080?.[0]) {
      const filePath = `uploads/${files.image1920x1080[0].filename}`;
      const isValid = await this.validateAspectRatio(filePath, 1920, 1080);
      if (!isValid) {
        fs.unlinkSync(filePath);
        throw new BadRequestException(
          'Image 1920x1080 must have aspect ratio 16:9 (1920x1080)',
        );
      }
    }

    if (files?.image522x760?.[0]) {
      const filePath = `uploads/${files.image522x760[0].filename}`;
      const isValid = await this.validateAspectRatio(filePath, 522, 760);
      if (!isValid) {
        fs.unlinkSync(filePath);
        throw new BadRequestException(
          'Image 522x760 must have aspect ratio 522:760',
        );
      }
    }

    const commonUpdateData = {
      ...updateSessionDto,
      imageUrl_1920x1080,
      imageUrl_522x760,
    };

    const existingSession = await this.sessionModel.findById(sessionId);
    if (!existingSession) {
      throw new NotFoundException('Session not found for update');
    }

    if (existingSession.sessionType !== sessionType) {
      throw new BadRequestException(
        `Session type mismatch. Expected ${existingSession.sessionType}, got ${sessionType}`,
      );
    }

    const updatedDoc = await this.sessionModel.findByIdAndUpdate(
      sessionId,
      commonUpdateData,
      { new: true },
    );

    return updatedDoc;
  }

  async updateSessionFaculties(
    sessionId: string,
    sessionType: string,
    facultyIds: string[],
  ): Promise<any> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const normalizedSessionType = sessionType.toLowerCase();
    const normalizedDbType = session.sessionType.toLowerCase();

    if (normalizedDbType !== normalizedSessionType) {
      throw new BadRequestException(
        `Session type mismatch. Expected ${session.sessionType}, got ${sessionType}`,
      );
    }

    session.faculty = facultyIds.map((id) => id as any);
    await session.save();

    return session;
  }

  async getUpcomingLivePrograms(
    limit: number,
    userAccess: IUserAccess,
  ): Promise<any> {
    const now = new Date();
    const populateFacultyQuery = { path: 'faculty', select: 'name image' };

    const upcomingPrograms = await this.sessionModel
      .find({
        sessionType: 'Live',
        startDate: { $gte: now },
      })
      .populate(populateFacultyQuery)
      .sort({ startDate: 1 })
      .limit(limit);

    const programsData = upcomingPrograms.map((p) => p.toObject() as ISession);
    return applySessionAccessControl(programsData, userAccess, 2);
  }

  async deleteSession(sessionId: string, sessionType: string): Promise<void> {
    const session = await this.sessionModel.findById(sessionId);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.sessionType !== sessionType) {
      throw new BadRequestException(
        `Session type mismatch. Expected ${session.sessionType}, got ${sessionType}`,
      );
    }

    await this.sessionModel.findByIdAndDelete(sessionId);
  }

  async getCompletedSessionsByUser(userId: string): Promise<any> {
    return await this.userSessionViewModel
      .find({ userId, isCompleted: true })
      .sort({ updatedAt: -1 });
  }

  generateZoomSignature(meetingNumber: string, role: string): string {
    const apiKey = this.configService.get<string>('ZOOM_API_KEY');
    const apiSecret = this.configService.get<string>('ZOOM_API_SECRET');

    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const payload = {
      sdkKey: apiKey,
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      tokenExp: exp,
    };

    return jwt.sign(payload, apiSecret!, { algorithm: 'HS256' });
  }

  async trackSessionView(
    userId: string,
    sessionId: string,
    moduleId: string,
  ): Promise<any> {
    return await this.userSessionViewModel.findOneAndUpdate(
      { userId, sessionId, moduleId },
      { $inc: { viewCount: 1 }, $set: { lastViewedAt: new Date() } },
      { upsert: true, new: true },
    );
  }

  private appendImageDomain(session: any): any {
    const domain = this.configService.get<string>('BACKEND_IMAGE_DOMAIN');

    if (!session) return session;

    if (Array.isArray(session.faculty)) {
      session.faculty = session.faculty.map((f) => {
        if (f?.image && !f.image.startsWith('http')) {
          f.image = `${domain}${f.image}`;
        }
        return f;
      });
    }

    if (
      session.imageUrl_1920x1080 &&
      !session.imageUrl_1920x1080.startsWith('http')
    ) {
      session.imageUrl_1920x1080 = `${domain}${session.imageUrl_1920x1080}`;
    }

    if (
      session.imageUrl_522x760 &&
      !session.imageUrl_522x760.startsWith('http')
    ) {
      session.imageUrl_522x760 = `${domain}${session.imageUrl_522x760}`;
    }

    return session;
  }

  private appendImageDomainToMany(sessions: any[]): any[] {
    return sessions.map((s) => this.appendImageDomain(s));
  }

  async generateAIComparisonStream(
    userObservations: string,
    facultyObservations: string,
  ): Promise<any> {
    const prompt = `
You are a clinical AI assistant. Compare the following user and faculty observations and return a 
well-structured **HTML report** (no markdown, only HTML).  

Use this structure:
<div class="section">
  <h3>1. Summary of Key Differences</h3>
  <p>...</p>
</div>
<div class="section">
  <h3>2. Areas of Agreement</h3>
  <p>...</p>
</div>
<div class="section">
  <h3>3. Suggestions for Improvement (for user)</h3>
  <ul>
    <li>...</li>
  </ul>
</div>
<div class="section">
  <h3>4. Overall Evaluation</h3>
  <p>...</p>
</div>

Keep the output clean, readable, and professional. Include line spacing and paragraph breaks.
Avoid repeating titles or adding markdown symbols.

User Observations:
${userObservations}

Faculty Observations:
${facultyObservations}
`;

    return await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });
  }
}
