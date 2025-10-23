import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { Subscription } from '../schemas/subscription.schema';
import { PaymentTransaction } from '../schemas/transaction.schema';
import { CreateRazorpayOrderDto } from '../dto/create-razorpay-order.dto';
import { VerifyRazorpayDto } from '../dto/verify-razorpay.dto';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;

  constructor(
    @InjectModel('Subscription') private subscriptionModel: Model<Subscription>,
    @InjectModel('PaymentTransaction')
    private transactionModel: Model<PaymentTransaction>,
    private configService: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID') || '',
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET') || '',
    });
  }

  async createOrder(data: CreateRazorpayOrderDto & { userId: string }) {
    const options = {
      amount: data.amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await this.razorpay.orders.create(options);

    const startDate = new Date();
    const expiryDate = new Date(startDate);
    switch (data.billingCycle) {
      case 'monthly':
        expiryDate.setMonth(startDate.getMonth() + 1);
        break;
      case 'quarterly':
        expiryDate.setMonth(startDate.getMonth() + 3);
        break;
      case 'biannually':
        expiryDate.setMonth(startDate.getMonth() + 6);
        break;
      case 'yearly':
        expiryDate.setFullYear(startDate.getFullYear() + 1);
        break;
    }

    const subscription = await this.subscriptionModel.create({
      userId: new Types.ObjectId(data.userId),
      packageId: new Types.ObjectId(data.packageId),
      billingCycle: data.billingCycle,
      amount: data.amount,
      currency: 'INR',
      status: 'pending',
      paymentGateway: 'razorpay',
      razorpayOrderId: order.id,
      startDate,
      expiryDate,
      autoRenew: data.autoRenew ?? false,
      metadata: data.metadata ?? {},
    });

    // Save transaction as "created"
    await this.transactionModel.create({
      userId: new Types.ObjectId(data.userId),
      packageId: new Types.ObjectId(data.packageId),
      amount: data.amount,
      currency: 'INR',
      paymentGateway: 'razorpay',
      gatewayOrderId: order.id,
      status: 'created',
      gatewayResponse: order,
    });

    return { orderId: order.id, subscription };
  }

  async verifyPayment(data: VerifyRazorpayDto & { userId: string }) {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      packageId,
    } = data;

    const expectedSignature = crypto
      .createHmac(
        'sha256',
        this.configService.get<string>('RAZORPAY_KEY_SECRET') || '',
      )
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    const paymentDetails = await this.razorpay.payments
      .fetch(razorpay_payment_id)
      .catch(() => null);

    let transactionStatus = 'failed';
    if (isValid && paymentDetails?.status === 'captured')
      transactionStatus = 'captured';

    const transaction = await this.transactionModel.create({
      userId: new Types.ObjectId(userId),
      packageId: new Types.ObjectId(packageId),
      amount: paymentDetails ? (paymentDetails.amount as number) / 100 : 0,
      currency: paymentDetails?.currency || 'INR',
      paymentGateway: 'razorpay',
      gatewayOrderId: razorpay_order_id,
      gatewayPaymentId: razorpay_payment_id,
      status: transactionStatus,
      gatewayResponse: paymentDetails || null,
      failureReason: isValid ? undefined : 'Signature mismatch',
    });

    if (!isValid || transactionStatus === 'failed') return { success: false };

    const amount = paymentDetails ? (paymentDetails.amount as number) / 100 : 0;
    const currency = paymentDetails?.currency || 'INR';

    const subscription = await this.subscriptionModel.findOneAndUpdate(
      {
        razorpayOrderId: razorpay_order_id,
        userId: new Types.ObjectId(userId),
      },
      {
        status: 'completed',
        razorpayPaymentId: razorpay_payment_id,
        amount,
        currency,
      },
      { new: true },
    );

    if (!subscription) return { success: false };

    return {
      success: true,
      subscriptionId: subscription._id.toString(),
      transactionId: transaction._id.toString(),
    };
  }
}
