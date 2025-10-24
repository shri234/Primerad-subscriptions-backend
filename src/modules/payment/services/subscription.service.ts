import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
} from '../schemas/subscription.schema';
import { Package, PackageDocument } from '../schemas/package.schema';
import { User } from '../../user/schema/user.schema';
import { CreateSubscriptionData } from '../interfaces/payment-gateway.interface';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Package.name)
    private packageModel: Model<PackageDocument>,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async createSubscription(data: CreateSubscriptionData) {
    const pkg = await this.packageModel.findById(data.packageId);
    const user = await this.userModel.findById(data.userId);

    if (!pkg || !user) {
      throw new NotFoundException('Package or User not found');
    }

    if (!pkg.isActive) {
      throw new BadRequestException('Package is not active');
    }

    const selectedPricing = pkg.pricingOptions.find(
      (option) => option.billingCycle === data.billingCycle,
    );

    if (!selectedPricing) {
      throw new BadRequestException(
        `Billing cycle '${data.billingCycle}' not available for this package`,
      );
    }

    const startDate = new Date();
    const expiryDate = this.calculateExpiryDate(startDate, data.billingCycle);

    const subscription = await this.subscriptionModel.create({
      userId: new Types.ObjectId(data.userId),
      packageId: new Types.ObjectId(data.packageId),
      billingCycle: data.billingCycle,
      amount: selectedPricing.amount,
      currency: selectedPricing.currency || 'USD',
      startDate,
      expiryDate,
      status: 'active',
      transactionId: new Types.ObjectId(data.transactionId),
      paymentGateway: data.paymentGateway,
      autoRenew: data.autoRenew || false,
    });

    await this.userModel.findByIdAndUpdate(data.userId, {
      activeSubscriptionId: subscription._id,
    });

    return subscription;
  }

  async getUserActiveSubscriptions(userId: string) {
    return this.subscriptionModel
      .find({
        userId: new Types.ObjectId(userId),
        status: 'active',
        expiryDate: { $gt: new Date() },
      })
      .populate('packageId')
      .sort({ startDate: -1 })
      .exec();
  }

  async getUserSubscriptionHistory(userId: string) {
    return this.subscriptionModel
      .find({
        userId: new Types.ObjectId(userId),
      })
      .populate('packageId')
      .sort({ startDate: -1 })
      .exec();
  }

  async getSubscriptionById(subscriptionId: string, userId?: string) {
    const query: any = { _id: new Types.ObjectId(subscriptionId) };
    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    const subscription = await this.subscriptionModel
      .findOne(query)
      .populate('packageId')
      .exec();

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async cancelSubscription(subscriptionId: string, userId: string) {
    const subscription = await this.subscriptionModel.findOne({
      _id: new Types.ObjectId(subscriptionId),
      userId: new Types.ObjectId(userId),
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === 'cancelled') {
      throw new BadRequestException('Subscription is already cancelled');
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.autoRenew = false;
    await subscription.save();

    return subscription;
  }

  async renewSubscription(subscriptionId: string, userId: string) {
    const subscription = await this.subscriptionModel
      .findOne({
        _id: new Types.ObjectId(subscriptionId),
        userId: new Types.ObjectId(userId),
      })
      .populate('packageId');

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const pkg = subscription.packageId as any;
    const selectedPricing = pkg.pricingOptions.find(
      (option) => option.billingCycle === subscription.billingCycle,
    );

    if (!selectedPricing) {
      throw new BadRequestException('Pricing option no longer available');
    }

    const startDate = new Date();
    const expiryDate = this.calculateExpiryDate(
      startDate,
      subscription.billingCycle,
    );

    // Create new subscription for renewal
    const renewedSubscription = await this.subscriptionModel.create({
      userId: subscription.userId,
      packageId: subscription.packageId,
      billingCycle: subscription.billingCycle,
      amount: selectedPricing.amount,
      currency: selectedPricing.currency || 'USD',
      startDate,
      expiryDate,
      status: 'active',
      autoRenew: subscription.autoRenew,
      previousSubscriptionId: subscription._id,
    });

    // Mark old subscription as completed
    subscription.status = 'completed';
    await subscription.save();

    return renewedSubscription;
  }

  async checkAndExpireSubscriptions() {
    // Cron job to run daily
    const result = await this.subscriptionModel.updateMany(
      {
        status: 'active',
        expiryDate: { $lt: new Date() },
      },
      {
        $set: { status: 'expired' },
      },
    );

    return {
      modifiedCount: result.modifiedCount,
      message: `${result.modifiedCount} subscriptions expired`,
    };
  }

  async toggleAutoRenew(
    subscriptionId: string,
    userId: string,
    autoRenew: boolean,
  ) {
    const subscription = await this.subscriptionModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(subscriptionId),
        userId: new Types.ObjectId(userId),
        status: 'active',
      },
      {
        $set: { autoRenew },
      },
      { new: true },
    );

    if (!subscription) {
      throw new NotFoundException('Active subscription not found');
    }

    return subscription;
  }

  async getUpcomingRenewals(daysAhead: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.subscriptionModel
      .find({
        status: 'active',
        autoRenew: true,
        expiryDate: {
          $gte: new Date(),
          $lte: futureDate,
        },
      })
      .populate('packageId')
      .populate('userId')
      .exec();
  }

  private calculateExpiryDate(startDate: Date, billingCycle: string): Date {
    const expiryDate = new Date(startDate);

    switch (billingCycle) {
      case 'monthly':
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
      case 'quarterly':
        expiryDate.setMonth(expiryDate.getMonth() + 3);
        break;
      case 'biannually':
        expiryDate.setMonth(expiryDate.getMonth() + 6);
        break;
      case 'yearly':
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        break;
      default:
        throw new BadRequestException(`Invalid billing cycle: ${billingCycle}`);
    }

    return expiryDate;
  }

  async getSubscriptionStats() {
    const stats = await this.subscriptionModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
        },
      },
    ]);

    return stats;
  }
}
