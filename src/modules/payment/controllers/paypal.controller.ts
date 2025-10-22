import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express'; // Changed to type import
import { ConfigService } from '@nestjs/config';
import { PayPalService } from '../services/paypal.service';
import { CreatePayPalOrderDto } from '../dto/create-paypal-order.dto';
import { GetUser } from '../../auth/decorators/get-user.decorator';

@Controller('payment/paypal')
export class PayPalController {
  constructor(
    private paypalService: PayPalService,
    private configService: ConfigService,
  ) {}

  @Post('create-order')
  @HttpCode(HttpStatus.OK)
  async createOrder(
    @Body() createOrderDto: CreatePayPalOrderDto,
    @Query('userId') userId: string,
  ) {
    const result = await this.paypalService.createOrder({
      ...createOrderDto,
      userId,
    });

    return {
      message: 'PayPal order created successfully',
      ...result,
    };
  }

  @Get('capture')
  async capturePayment(
    @Query('token') token: string,
    @Query('PayerID') payerId: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.paypalService.capturePayment(token, payerId);

      return res.redirect(
        `${this.configService.get<string>('FRONTEND_URL')}/subscription-success?status=success&orderId=${token}`,
      );
    } catch (error) {
      return res.redirect(
        `${this.configService.get<string>('FRONTEND_URL')}/payment-failed?status=error&orderId=${token}&message=${encodeURIComponent(error.message)}`,
      );
    }
  }
}
