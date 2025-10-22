import {
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class PricingOptionDto {
  @IsEnum(['monthly', 'yearly', 'biannually', 'quarterly'])
  billingCycle: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  originalAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string; // default: 'USD'
}

export class CreatePackageDto {
  @IsString()
  packageName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingOptionDto)
  pricingOptions: PricingOptionDto[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  popularBadge?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
