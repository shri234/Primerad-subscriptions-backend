import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Package',
    required: true,
    index: true,
  })
  packageId: MongooseSchema.Types.ObjectId;

  @Prop({
    required: true,
    enum: ['monthly', 'yearly', 'biannually', 'quarterly'],
    type: String,
  })
  billingCycle: string; // NEW: Store which billing cycle was chosen

  @Prop({ required: true })
  amount: number; // NEW: Store the amount paid

  @Prop({ default: 'USD' })
  currency: string; // NEW: Store the currency

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true, index: true })
  expiryDate: Date;

  @Prop({
    required: true,
    enum: ['active', 'expired', 'cancelled', 'pending', 'completed'],
    default: 'pending',
    index: true,
  })
  status: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Transaction' })
  transactionId: MongooseSchema.Types.ObjectId;

  @Prop()
  paymentGateway: string;

  @Prop({ default: false })
  autoRenew: boolean;

  @Prop()
  cancelledAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Subscription' })
  previousSubscriptionId?: MongooseSchema.Types.ObjectId; // NEW: Track renewal chain

  @Prop({ type: Object })
  metadata?: Record<string, any>; // NEW: For storing additional data
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ expiryDate: 1, status: 1 });
SubscriptionSchema.index({ userId: 1, expiryDate: 1 });
SubscriptionSchema.index({ autoRenew: 1, expiryDate: 1 });

// // ============================================
// // DTOs for API endpoints
// // ============================================

// import {
//   IsString,
//   IsEnum,
//   IsOptional,
//   IsBoolean,
//   IsMongoId,
// } from 'class-validator';

// export class CreateSubscriptionDto {
//   @IsMongoId()
//   packageId: string;

//   @IsEnum(['monthly', 'yearly', 'biannually', 'quarterly'])
//   billingCycle: string;

//   @IsString()
//   transactionId: string;

//   @IsString()
//   paymentGateway: string;

//   @IsOptional()
//   @IsBoolean()
//   autoRenew?: boolean;
// }

// export class CancelSubscriptionDto {
//   @IsMongoId()
//   subscriptionId: string;
// }

// export class ToggleAutoRenewDto {
//   @IsMongoId()
//   subscriptionId: string;

//   @IsBoolean()
//   autoRenew: boolean;
// }
