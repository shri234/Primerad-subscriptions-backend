// src/modules/payment/services/razorpay.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose'; // Added Types import
import Razorpay from 'razorpay'; // Changed to default import
import * as crypto from 'crypto';
import { Subscription } from '../schemas/subscription.schema';
import { IPaymentGateway } from '../interfaces/payment-gateway.interface';

@Injectable()
export class RazorpayService implements IPaymentGateway {
  private razorpay: Razorpay;

  constructor(
    @InjectModel('Subscription')
    private subscriptionModel: Model<Subscription>,
    private configService: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID') || '',
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET') || '',
    });
  }

  async createOrder(data: any): Promise<any> {
    const options = {
      amount: data.amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await this.razorpay.orders.create(options);

    // Create pending subscription
    const subscription = await this.subscriptionModel.create({
      userId: new Types.ObjectId(data.userId), // Now Types is imported
      packageId: new Types.ObjectId(data.packageId), // Now Types is imported
      status: 'pending',
      paymentGateway: 'razorpay',
      razorpayOrderId: order.id,
    });

    return { orderId: order.id, subscription };
  }

  validateWebhook(payload: string, signature: string): boolean {
    const webhookSecret = this.configService.get<string>(
      'RAZORPAY_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret) // Now webhookSecret is properly typed
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  }

  async verifyPayment(data: any): Promise<any> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac(
        'sha256',
        this.configService.get<string>('RAZORPAY_KEY_SECRET') || '',
      )
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      const paymentDetails =
        await this.razorpay.payments.fetch(razorpay_payment_id);

      // Create transaction record
      const transaction = await this.subscriptionModel.create({
        userId: new Types.ObjectId(data.userId), // Now Types is imported
        packageId: new Types.ObjectId(data.packageId), // Now Types is imported
        amount: (paymentDetails.amount as number) / 100, // Type assertion to fix arithmetic error
        status: 'completed',
        paymentGateway: 'razorpay',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });

      return {
        success: true,
        transactionId: (transaction._id as Types.ObjectId).toString(), // Type assertion
      };
    }

    return { success: false };
  }

  async capturePayment(orderId: string): Promise<any> {
    // Implementation
    return { success: true };
  }

  async refundPayment(transactionId: string): Promise<any> {
    // Implementation
    return { success: true };
  }
}
