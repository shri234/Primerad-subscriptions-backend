import { IsString, IsMongoId } from 'class-validator';

export class VerifyRazorpayDto {
  @IsString()
  razorpay_order_id: string;

  @IsString()
  razorpay_payment_id: string;

  @IsString()
  razorpay_signature: string;

  @IsMongoId()
  packageId: string;
}
