import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { Console } from 'console';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalAuthGuard.name);

  constructor(
    @InjectModel('User') private userModel: Model<any>,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      // Extract token from cookies or Authorization header
      const token =
        request.cookies?.jwt || request.headers['authorization']?.split(' ')[1];

      // If no token, set user to null and continue
      if (!token) {
        request.user = null;
        return true;
      }

      // Verify JWT token
      const secretKey = this.configService.get<string>('SECRET_KEY');
      if (!secretKey) {
        this.logger.warn('SECRET_KEY is not configured');
        request.user = null;
        return true;
      }

      const decoded = jwt.verify(token, secretKey) as any;

      // Fetch user from database
      const user = await this.userModel
        .findById(decoded._id)
        .select('-password');

      // If user found, attach to request; otherwise set to null
      request.user = {
        _id: user._id,
        isLoggedIn: user ? true : false,
        isSubscribed: false,
      };
      console.log(request.user);
      return true;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.debug('Invalid token in optional auth');
      } else if (error instanceof jwt.TokenExpiredError) {
        this.logger.debug('Expired token in optional auth');
      } else {
        this.logger.debug('Optional auth error:', error.message);
      }

      request.user = null;
      return true;
    }
  }
}
