// src/modules/payment/controllers/razorpay.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Headers,
  BadRequestException,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { RazorpayService } from '../services/razorpay.service';
import { VerifyRazorpayDto } from '../dto/verify-razorpay.dto';
import { CreateRazorpayOrderDto } from '../dto/create-razorpay-order.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import express from 'express';
import type { UserDocument } from 'src/modules/user/schema/user.schema';

@Controller('payment/razorpay')
export class RazorpayController {
  constructor(private readonly razorpayService: RazorpayService) {}
  @Post('create-order')
  @UseGuards(AuthGuard)
  async createOrder(
    @Body() orderData: CreateRazorpayOrderDto,
    @GetUser() user: any,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    console.log(user, 'user-details');

    return this.razorpayService.createOrder({
      ...orderData,
      userId: user._id,
    });
  }

  @Post('verify')
  @UseGuards(AuthGuard)
  async verifyPayment(
    @Body() verificationData: VerifyRazorpayDto,
    @GetUser() user: any,
  ) {
    return this.razorpayService.verifyPayment({
      ...verificationData,
      userId: user.id,
    });
  }

  // @Post('webhook')
  // async handleWebhook(
  //   @Req() req: express.Request,
  //   @Headers('x-razorpay-signature') signature: string,
  // ) {
  //   const raw = (req as any).rawBody;
  //   if (!raw) throw new BadRequestException('Raw body not found');

  //   const isValid = this.razorpayService.validateWebhook(raw, signature);
  //   if (!isValid) throw new BadRequestException('Invalid webhook signature');

  //   // Handle events like payment.captured or subscription.paid
  //   return { status: 'success' };
  // }
}
