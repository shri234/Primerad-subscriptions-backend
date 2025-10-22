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
import type { UserDocument } from '../../user/schema/user.schema'; // Import UserDocument
import type { Request } from 'express';

// Define the consistent RequestWithUser interface here as well
interface RequestWithUser extends Request {
  user?: UserDocument;
  cookies: Record<string, string>; // cookie-parser adds this
  headers: Record<string, string | string[]>;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    // 1. Specify the correct type for userModel to ensure 'user' is UserDocument
    @InjectModel('User') private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: any = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse(); // response is not strictly needed here but kept for context

    try {
      const token =
        request.cookies?.jwt ||
        request?.headers['authorization']?.split(' ')[1];

      if (!token) {
        throw new UnauthorizedException('No authentication token provided');
      }

      const secretKey = this.configService.get<string>('SECRET_KEY');
      if (!secretKey) {
        this.logger.error('SECRET_KEY is not configured');
        throw new UnauthorizedException('Server configuration error');
      }

      const decoded = jwt.verify(token, secretKey) as { _id: string }; // Use a more precise type for decoded

      // 3. The returned user is a Mongoose document, which should match UserDocument
      const user = (await this.userModel
        .findById(decoded._id)
        .select('-password')
        .lean<UserDocument>()) as UserDocument; // Add .lean() to ensure a plain object or cast to UserDocument

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // 4. Assign the correctly typed user to the request object
      request.user = user;

      return true;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }

      this.logger.error('Authentication error:', error);
      // Re-throw if it's already an HttpException, otherwise throw a generic one
      throw error instanceof UnauthorizedException
        ? error
        : new UnauthorizedException('Authentication failed');
    }
  }
}
