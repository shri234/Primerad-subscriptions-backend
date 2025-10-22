import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentTransactionDocument = PaymentTransaction & Document;

@Schema({ timestamps: true })
export class PaymentTransaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Package', required: true })
  packageId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true, enum: ['razorpay', 'paypal'] })
  paymentGateway: string;

  @Prop()
  gatewayOrderId: string;

  @Prop()
  gatewayPaymentId?: string;

  @Prop({
    required: true,
    enum: ['created', 'pending', 'captured', 'failed', 'refunded'],
  })
  status: string;

  @Prop({ type: Object })
  gatewayResponse?: Record<string, any>;

  @Prop()
  failureReason?: string;
}

export const PaymentTransactionSchema =
  SchemaFactory.createForClass(PaymentTransaction);

// Add indexes
PaymentTransactionSchema.index({ userId: 1, status: 1 });
PaymentTransactionSchema.index({ gatewayOrderId: 1 });
