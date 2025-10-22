import {
  Controller,
  Post,
  Body,
  UseGuards,
  Headers,
  BadRequestException, // Added import
} from '@nestjs/common';
import { RazorpayService } from '../services/razorpay.service';
import { VerifyRazorpayDto } from '../dto/verify-razorpay.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../user/schema/user.schema';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';

@Controller('payment/razorpay')
export class RazorpayController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Post('create-order')
  @UseGuards(AuthGuard)
  async createOrder(
    @Body() orderData: VerifyRazorpayDto,
    @GetUser() user: any,
  ) {
    return this.razorpayService.createOrder({
      ...orderData,
      userId: user.id,
    });
  }

  @Post('verify')
  @UseGuards(AuthGuard)
  async verifyPayment(@Body() verificationData: any, @GetUser() user: any) {
    return this.razorpayService.verifyPayment(verificationData);
  }

  @Post('webhook')
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const isValid = this.razorpayService.validateWebhook(
      JSON.stringify(payload),
      signature,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature'); // Now imported
    }

    // Process webhook event
    return { status: 'success' };
  }
}
