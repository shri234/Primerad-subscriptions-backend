import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
  Logger,
  Res,
  Req,
  HttpCode,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { Express } from 'express';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  // 🔹 LOGIN ENDPOINT
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.authService.login(loginDto);

      res.cookie('jwt', result.accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return {
        message: result.message,
        accessToken: result.accessToken,
        user: result.user,
      };
    } catch (error) {
      this.logger.error('Login error:', error);
      throw new HttpException(
        { message: error.message || 'An error occurred during login.' },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 🔹 REGISTER ENDPOINT (requires OTP verification)
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      const result = await this.authService.register(registerDto);
      return result;
    } catch (error) {
      this.logger.error('Registration error:', error);
      throw new HttpException(
        { message: error.message || 'An error occurred during registration.' },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 🔹 SEND OTP ENDPOINT (newly added)
  @Post('send-otp')
  async sendOtp(@Body('email') email: string) {
    try {
      if (!email?.trim()) {
        throw new HttpException('Email is required.', HttpStatus.BAD_REQUEST);
      }

      const result = await this.otpService.generateOtp(
        email.trim().toLowerCase(),
      );
      return result;
    } catch (error) {
      this.logger.error('OTP send error:', error);
      throw new HttpException(
        { message: error.message || 'Failed to send OTP.' },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 🔹 REFRESH TOKEN ENDPOINT
  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const result = await this.authService.refreshToken(refreshToken);

      res.cookie('jwt', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24h
      });

      return result;
    } catch (error) {
      this.logger.error('Token refresh error:', error);
      throw new HttpException(
        { message: error.message || 'An error occurred during token refresh.' },
        error.status || HttpStatus.UNAUTHORIZED,
      );
    }
  }

  // 🔹 LOGOUT ENDPOINT
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    try {
      res.clearCookie('jwt');
      res.clearCookie('refreshToken');

      return {
        message: 'Logged out successfully',
      };
    } catch (error) {
      this.logger.error('Logout error:', error);
      throw new HttpException(
        { message: 'An error occurred during logout.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
