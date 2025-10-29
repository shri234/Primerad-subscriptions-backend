import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import type { UserDocument } from '../../user/schema/user.schema';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user?: UserDocument;
  cookies: Record<string, string>;
  headers: Record<string, string | string[]>;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: any = context.switchToHttp().getRequest<RequestWithUser>();

    try {
      // ✅ 1️⃣ Check if cookie-parser actually populated cookies
      const jwtCookie = request.cookies?.jwt;
      const headerToken = request.headers['authorization']?.split(' ')[1];
      const token = jwtCookie || headerToken;

      if (!token) {
        throw new UnauthorizedException('No authentication token provided');
      }

      // ✅ 2️⃣ Get secret key safely
      const secretKey = this.configService.get<string>('SECRET_KEY');
      if (!secretKey) {
        this.logger.error('SECRET_KEY is not configured');
        throw new UnauthorizedException('Server configuration error');
      }

      // ✅ 3️⃣ Verify and decode JWT
      const decoded = jwt.verify(token, secretKey) as { _id: string };

      // ✅ 4️⃣ Find user in DB (omit password)
      const user = await this.userModel
        .findById(decoded._id)
        .select('-password')
        .lean<UserDocument>()
        .exec();

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // ✅ 5️⃣ Attach user to request for controllers
      request.user = user;

      return true;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }

      this.logger.error('Authentication error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
