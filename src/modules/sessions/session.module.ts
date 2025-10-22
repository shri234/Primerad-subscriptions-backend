import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import {
  Session,
  SessionSchema,
  PlaybackProgress,
  PlaybackProgressSchema,
  UserSessionView,
  UserSessionViewSchema,
} from './schema/session.schema';
import {
  Pathology,
  PathologySchema,
} from '../pathology/schema/pathology.schema';
import { User, UserSchema } from '../user/schema/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { Faculty, FacultySchema } from '../faculty/schema/faculty.schema';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.SECRET_KEY,
      signOptions: { expiresIn: '1h' },
    }),
    MongooseModule.forFeature([
      {
        name: Session.name,
        schema: SessionSchema,
      },
      {
        name: Pathology.name,
        schema: PathologySchema,
      },
      {
        name: PlaybackProgress.name,
        schema: PlaybackProgressSchema,
      },
      {
        name: UserSessionView.name,
        schema: UserSessionViewSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Faculty.name,
        schema: FacultySchema,
      },
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  ],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService, MongooseModule],
})
export class SessionModule {}
