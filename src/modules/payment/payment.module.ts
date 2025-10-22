import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Schemas
import { Package, PackageSchema } from './schemas/package.schema';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from './schemas/transaction.schema';

// Controllers
import { PackageController } from './controllers/package.controller';
import { RazorpayController } from './controllers/razorpay.controller';
import { PayPalController } from './controllers/paypal.controller';

// Services
import { SubscriptionService } from './services/subscription.service';
import { TransactionService } from './services/transaction.service';
import { RazorpayService } from './services/razorpay.service';
import { PayPalService } from './services/paypal.service';

// Import User schema from user module
import { User, UserSchema } from '../user/schema/user.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Package.name, schema: PackageSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PackageController, RazorpayController, PayPalController],
  providers: [
    SubscriptionService,
    TransactionService,
    RazorpayService,
    PayPalService,
  ],
  exports: [SubscriptionService, TransactionService],
})
export class PaymentModule {}
