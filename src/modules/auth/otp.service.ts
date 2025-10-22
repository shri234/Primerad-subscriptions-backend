import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailService } from '../../config/email.util';
import { Otp } from '../user/schema/otp.schema';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
    private readonly emailService: EmailService,
  ) {}

  async generateOtp(email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.otpModel.create({ email, otp });

    const subject = 'Your OTP Verification Code';
    const html = `
      <div style="font-family:Arial, sans-serif;max-width:600px;margin:auto;padding:20px;border-radius:10px;border:1px solid #eee;">
        <h2 style="color:#333;">Email Verification</h2>
        <p style="font-size:16px;">Your OTP for signup is:</p>
        <p style="font-size:24px;font-weight:bold;color:#d5896f;">${otp}</p>
        <p>This OTP will expire in <b>5 minutes</b>.</p>
        <hr/>
        <p style="font-size:12px;color:#888;">If you didn’t request this, please ignore this email.</p>
      </div>
    `;

    await this.emailService.sendMail(email, subject, html);

    this.logger.log(`OTP sent to ${email}`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const record = await this.otpModel.findOne({ email, otp });
    if (!record) throw new BadRequestException('Invalid or expired OTP');

    await this.otpModel.deleteOne({ email });
    this.logger.log(`OTP verified for ${email}`);
    return true;
  }
}
