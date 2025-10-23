import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schema/user.schema';

export type UserBeltHistoryDocument = UserBeltHistory & Document;

@Schema({ timestamps: true, collection: 'user_belt_history' })
export class UserBeltHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  belt: string;

  @Prop({ required: true })
  pointsAtPromotion: number;

  @Prop({ default: Date.now })
  achievedAt: Date;
}

export const UserBeltHistorySchema =
  SchemaFactory.createForClass(UserBeltHistory);

UserBeltHistorySchema.index({ userId: 1 });
UserBeltHistorySchema.index({ belt: 1 });
