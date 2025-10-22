import {
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsMongoId,
} from 'class-validator';

export class CreateRazorpayOrderDto {
  @IsNumber()
  amount: number;

  @IsMongoId()
  packageId: string;

  @IsEnum(['monthly', 'quarterly', 'biannually', 'yearly'])
  billingCycle: string;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}
