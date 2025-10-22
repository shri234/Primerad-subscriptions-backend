import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PackageDocument = Package & Document;

// Sub-schema for pricing options
@Schema({ _id: false })
export class PricingOption {
  @Prop({
    required: true,
    enum: ['monthly', 'yearly', 'biannually', 'quarterly'],
    type: String,
  })
  billingCycle: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ min: 0, max: 100 })
  discountPercentage?: number; // Discount percentage (0-100)

  @Prop()
  originalAmount?: number; // Original price before discount (for display)

  @Prop({ default: 'USD' })
  currency: string; // Default to USD, but can be overridden
}

export const PricingOptionSchema = SchemaFactory.createForClass(PricingOption);

@Schema({ timestamps: true })
export class Package {
  @Prop({ required: true, unique: true, trim: true })
  packageName: string; // e.g., 'Basic', 'Advanced', 'Premium'

  @Prop({
    type: [PricingOptionSchema],
    required: true,
    validate: {
      validator: function (pricingOptions: PricingOption[]) {
        // Ensure no duplicate billing cycles
        const cycles = pricingOptions.map((p) => p.billingCycle);
        return cycles.length === new Set(cycles).size;
      },
      message: 'Duplicate billing cycles are not allowed for the same package',
    },
  })
  pricingOptions: PricingOption[]; // Array of pricing options

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Object })
  features?: Record<string, any>; // e.g., { maxUsers: 10, storage: '100GB' }

  @Prop({ min: 0 })
  displayOrder?: number; // For sorting packages in UI

  @Prop()
  popularBadge?: boolean; // Mark package as "Most Popular"

  @Prop({ type: [String] })
  tags?: string[]; // e.g., ['best-value', 'limited-offer']
}

export const PackageSchema = SchemaFactory.createForClass(Package);

// Indexes for better query performance
PackageSchema.index({ packageName: 1, isActive: 1 });
PackageSchema.index({ displayOrder: 1 });
PackageSchema.index({ 'pricingOptions.billingCycle': 1 });
