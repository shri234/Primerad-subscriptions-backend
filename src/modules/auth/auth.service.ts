import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../user/schema/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import disposableDomains from 'disposable-email-domains';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private otpService: OtpService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const { identifier, password } = loginDto;

    if (!identifier || !password) {
      this.logger.error('Identifier or password missing in login request.');
      throw new BadRequestException('Identifier and password are required.');
    }

    this.logger.log(`Login attempt with identifier: ${identifier}`);

    const findUser = await this.userModel.findOne({
      $or: [{ email: identifier.trim() }, { mobileNumber: identifier.trim() }],
    });

    if (!findUser) {
      this.logger.error(`Invalid credentials for identifier: ${identifier}`);
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await findUser.comparePassword(password);
    if (!isPasswordValid) {
      this.logger.error(`Password mismatch for identifier: ${identifier}`);
      throw new UnauthorizedException('Invalid credentials.');
    }

    const accessToken = await this.generateToken({ _id: findUser._id });
    const refreshToken = await this.generateRefreshToken({ _id: findUser._id });

    this.logger.log(`User ${findUser._id} successfully logged in.`);

    return {
      message: 'Successfully Logged In',
      accessToken,
      refreshToken,
      user: {
        _id: findUser._id,
        name: findUser.name,
        email: findUser.email,
        mobileNumber: findUser.mobileNumber,
        role: findUser.role,
        subscription: findUser.subscription
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name, mobileNumber, designation, role, otp } =
      registerDto;

    const trimmedEmail = email?.trim().toLowerCase();

    const emailDomain = trimmedEmail.split('@')[1];
    if (disposableDomains.includes(emailDomain)) {
      throw new BadRequestException(
        'Temporary or disposable email addresses are not allowed.',
      );
    }

    const emailExists = await this.userModel.findOne({ email: trimmedEmail });
    if (emailExists) throw new BadRequestException('Email already exists.');

    const mobileExists = await this.userModel.findOne({
      mobileNumber: mobileNumber?.trim(),
    });
    if (mobileExists)
      throw new BadRequestException('Mobile number already exists.');

    const otpVerified = await this.otpService.verifyOtp(trimmedEmail, otp);
    if (!otpVerified) throw new BadRequestException('Invalid or expired OTP');
    const user = new this.userModel({
      email: trimmedEmail,
      password: password.trim(),
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      designation: designation?.trim(),
      role: role || 'user',
    });

    await user.save();
    this.logger.log(`User created successfully: ${user._id}`);

    return {
      message: 'User created successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    try {
      const decoded = await this.verifyToken(
        refreshToken,
        this.configService.get<string>('REFRESH_SECRET_KEY') ||
          this.configService.get<string>('SECRET_KEY') ||
          '', // added fallback
      );

      const newAccessToken = await this.generateToken({ _id: decoded._id });

      return {
        message: 'Access token refreshed',
        accessToken: newAccessToken,
      };
    } catch (err) {
      this.logger.error('Invalid refresh token:', err);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generateToken(payload: any): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('SECRET_KEY') || '',
      expiresIn: '24h',
    });
  }

  async generateRefreshToken(payload: any): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret:
        this.configService.get<string>('REFRESH_SECRET_KEY') ||
        this.configService.get<string>('SECRET_KEY') ||
        '',
      expiresIn: '7d',
    });
  }

  async verifyToken(token: string, secret: string): Promise<any> {
    return this.jwtService.verifyAsync(token, { secret });
  }

  async validateUser(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
