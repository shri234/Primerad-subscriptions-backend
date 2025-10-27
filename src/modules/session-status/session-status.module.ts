import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionStatusService } from './session-status.service';
import { SessionStatusController } from './session-status.controller';
import { User, UserSchema } from '../user/schema/user.schema';
import {
  Session,
  SessionSchema,
  PlaybackProgress,
  PlaybackProgressSchema,
  UserSessionView,
  UserSessionViewSchema,
} from '../sessions/schema/session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: User.name, schema: UserSchema },
      { name: PlaybackProgress.name, schema: PlaybackProgressSchema },
      { name: UserSessionView.name, schema: UserSessionViewSchema },
    ]),
  ],
  controllers: [SessionStatusController],
  providers: [SessionStatusService],
  exports: [SessionStatusService],
})
export class SessionStatusModule {}
