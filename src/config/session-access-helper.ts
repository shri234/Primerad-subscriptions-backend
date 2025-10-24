import { Document, Types } from 'mongoose';

/**
 * Session interface (based on your schema)
 */
export interface ISession extends Document {
  _id: Types.ObjectId | string;
  title: string;
  description?: string;
  imageUrl_1920x1080?: string;
  imageUrl_522x760?: string;
  difficulty?: string;
  moduleName?: string;
  pathologyName?: string;
  pathologyId?: Types.ObjectId
  createdAt?: Date;
  isFree?: boolean;
  sessionType?: string;
  faculty?: string;
}

/**
 * User access information
 */
export interface IUserAccess {
  isLoggedIn: boolean;
  isSubscribed: boolean;
}

/**
 * Access level types
 */
export type AccessLevel = 'guest' | 'loggedIn' | 'subscribed';

/**
 * Output type for controlled session
 */
export interface IControlledSession extends Omit<ISession, keyof Document> {
  _id: string;
  isLocked: boolean;
  accessLevel: AccessLevel;
  lockReason?: string;
}

/**
 * Apply session access control logic
 */
export function applySessionAccessControl(
  sessions: ISession[],
  userAccess: IUserAccess,
  freeLimit: number = 2,
): IControlledSession[] {
  const { isLoggedIn, isSubscribed }: IUserAccess = userAccess ?? {
    isLoggedIn: false,
    isSubscribed: false,
  };

  // Subscribed: all unlocked
  if (isSubscribed) {
    return sessions.map(
      (session: ISession): IControlledSession => ({
        ...(session.toObject?.() ?? session),
        _id: session._id.toString(),
        isLocked: false,
        accessLevel: 'subscribed' as AccessLevel,
      }),
    );
  }

  const freeSessions: ISession[] = sessions.filter(
    (s: ISession): boolean => s.isFree === true,
  );
  const paidSessions: ISession[] = sessions.filter(
    (s: ISession): boolean => s.isFree !== true,
  );

  let accessibleSessions: IControlledSession[] = [];
  let lockedSessions: IControlledSession[] = [];

  if (!isLoggedIn) {
    // Guest: only 2 random free sessions
    const randomFreeSessions: ISession[] = shuffleArray<ISession>(
      freeSessions,
    ).slice(0, freeLimit);

    accessibleSessions = randomFreeSessions.map(
      (session: ISession): IControlledSession => ({
        ...(session.toObject?.() ?? session),
        _id: session._id.toString(),
        isLocked: false,
        accessLevel: 'guest' as AccessLevel,
      }),
    );

    const remainingSessions: ISession[] = [
      ...freeSessions.filter(
        (s: ISession): boolean => !randomFreeSessions.includes(s),
      ),
      ...paidSessions,
    ];

    lockedSessions = remainingSessions.map(
      (session: ISession): IControlledSession => ({
        ...sanitizeLockedSession(session),
        _id: session._id.toString(),
        isLocked: true,
        accessLevel: 'guest' as AccessLevel,
        lockReason: 'Please login to access more content',
      }),
    );
  } else {
    // Logged in but not subscribed
    const loggedInFreeLimit: number = Math.min(
      freeLimit + 3,
      freeSessions.length,
    );
    const accessibleFreeSessions: ISession[] = freeSessions.slice(
      0,
      loggedInFreeLimit,
    );

    accessibleSessions = accessibleFreeSessions.map(
      (session: ISession): IControlledSession => ({
        ...(session.toObject?.() ?? session),
        _id: session._id.toString(),
        isLocked: false,
        accessLevel: 'loggedIn' as AccessLevel,
      }),
    );

    const remainingSessions: ISession[] = [
      ...freeSessions.slice(loggedInFreeLimit),
      ...paidSessions,
    ];

    lockedSessions = remainingSessions.map(
      (session: ISession): IControlledSession => ({
        ...sanitizeLockedSession(session),
        _id: session._id.toString(),
        isLocked: true,
        accessLevel: 'loggedIn' as AccessLevel,
        lockReason: 'Subscribe to access this content',
      }),
    );
  }

  return [...accessibleSessions, ...lockedSessions];
}

/**
 * Sanitize locked session (hide sensitive info)
 */
export function sanitizeLockedSession(
  session: ISession,
): Omit<IControlledSession, 'isLocked' | 'accessLevel' | 'lockReason'> {
  const desc: string = session.description?.substring(0, 100) + '...' || '';

  return {
    _id: session._id.toString(),
    title: session.title || 'Untitled Session',
    description: desc,
    imageUrl_1920x1080: session.imageUrl_1920x1080,
    imageUrl_522x760: session.imageUrl_522x760,
    difficulty: session.difficulty,
    moduleName: session.moduleName,
    pathologyName: session.pathologyName,
    createdAt: session.createdAt,
    isFree: session.isFree,
    sessionType: session.sessionType,
    faculty: session.faculty,
  };
}

/**
 * Shuffle array randomly (Fisher–Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled: T[] = [...array];
  for (let i: number = shuffled.length - 1; i > 0; i--) {
    const j: number = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
