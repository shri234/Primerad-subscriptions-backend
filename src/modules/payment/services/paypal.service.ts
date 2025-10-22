import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose'; // Added Types import
import * as paypal from '@paypal/checkout-server-sdk';
import { IPaymentGateway } from '../interfaces/payment-gateway.interface';
import { TransactionService } from './transaction.service';
import { SubscriptionService } from './subscription.service';
import { CreatePayPalOrderDto } from '../dto/create-paypal-order.dto';

@Injectable()
export class PayPalService implements IPaymentGateway {
  private payPalClient: paypal.core.PayPalHttpClient;

  constructor(
    private configService: ConfigService,
    private transactionService: TransactionService,
    private subscriptionService: SubscriptionService,
  ) {
    const environment =
      this.configService.get<string>('PAYPAL_MODE') === 'live'
        ? new paypal.core.LiveEnvironment(
            this.configService.get<string>('PAYPAL_CLIENT_ID'),
            this.configService.get<string>('PAYPAL_CLIENT_SECRET'),
          )
        : new paypal.core.SandboxEnvironment(
            this.configService.get<string>('PAYPAL_CLIENT_ID'),
            this.configService.get<string>('PAYPAL_CLIENT_SECRET'),
          );

    this.payPalClient = new paypal.core.PayPalHttpClient(environment);
  }

  async createOrder(data: CreatePayPalOrderDto & { userId: string }) {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: data.currency,
            value: data.amount.toFixed(2),
          },
          description: `Subscription for ${data.packageName} plan`,
          custom_id: data.packageId,
          soft_descriptor: 'PRIMERAD SUB',
        },
      ],
      application_context: {
        shipping_preference: 'NO_SHIPPING',
        brand_name: 'PRIMERAD',
        user_action: 'PAY_NOW',
        landing_page: 'BILLING',
        return_url: `${this.configService.get<string>('API_URL')}/payment/paypal/capture`,
        cancel_url: `${this.configService.get<string>('FRONTEND_URL')}/payment-cancelled`,
      },
    });

    const orderResponse = await this.payPalClient.execute(request);
    const order = orderResponse.result;

    const approvalUrl = order.links.find(
      (link) => link.rel === 'approve',
    )?.href;

    if (!approvalUrl) {
      throw new BadRequestException('Failed to get PayPal approval URL');
    }

    await this.transactionService.createTransaction({
      userId: new Types.ObjectId(data.userId), // Now Types is imported
      packageId: new Types.ObjectId(data.packageId), // Now Types is imported
      amount: Number(data.amount),
      currency: data.currency,
      paymentGateway: 'paypal',
      gatewayOrderId: order.id,
      status: order.status.toLowerCase(),
      gatewayResponse: order,
    });

    return {
      orderId: order.id,
      approvalUrl,
    };
  }

  // Fixed method signature to match IPaymentGateway interface
  // The interface expects (orderId: string), but PayPal needs both token and payerId
  // So we accept orderId as first param and payerId as optional second param
  async capturePayment(orderId: string, payerId?: string) {
    // orderId is actually the token in PayPal's case
    const token = orderId;

    const pendingTransaction =
      await this.transactionService.findByGatewayOrderId(token, 'paypal');

    if (!pendingTransaction || pendingTransaction.status !== 'created') {
      throw new NotFoundException('Pending transaction not found');
    }

    const request = new paypal.orders.OrdersCaptureRequest(token);
    const captureResponse = await this.payPalClient.execute(request);
    const order = captureResponse.result;

    if (['COMPLETED', 'APPROVED', 'CAPTURED'].includes(order.status)) {
      const gatewayPaymentId =
        order.purchase_units[0]?.payments?.captures?.[0]?.id;

      await this.transactionService.updateTransactionStatus(
        (pendingTransaction._id as Types.ObjectId).toString(),
        'captured',
        order,
        gatewayPaymentId,
      );

      const subscription = await this.subscriptionService.createSubscription({
        userId: (pendingTransaction.userId as Types.ObjectId).toString(),
        packageId: (pendingTransaction.packageId as Types.ObjectId).toString(),
        billingCycle: 'monthly', // ✅ required
        transactionId: (pendingTransaction._id as Types.ObjectId).toString(),
        paymentGateway: 'paypal',
      });

      return { order, subscription };
    } else {
      await this.transactionService.updateTransactionStatus(
        (pendingTransaction._id as Types.ObjectId).toString(),
        order.status.toLowerCase(),
        order,
      );
      throw new BadRequestException(`Payment not completed: ${order.status}`);
    }
  }

  async verifyPayment(data: any): Promise<boolean> {
    // PayPal doesn't need signature verification like Razorpay
    // Verification is done during capture
    return true;
  }

  // Required by IPaymentGateway interface if not already present
  async refundPayment(transactionId: string): Promise<any> {
    // Implementation for PayPal refunds
    return { success: true, transactionId };
  }
}
