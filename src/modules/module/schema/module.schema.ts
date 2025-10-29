// schemas/module.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ModuleDocument = Module & Document;

@Schema({ timestamps: true })
export class Module {
  @Prop({
    type: String,
    required: true,
    trim: true,
    unique: true,
  })
  moduleName: string;

  @Prop({
    type: String,
    default: null,
    trim: true,
  })
  description?: string;

  @Prop({
    type: String,
    default: null,
    trim: true,
  })
  imageUrl?: string;

  @Prop({
    type: Boolean,
    default: false, // <-- new field
  })
  assessment: boolean;

  @Prop({
    type: Date,
    default: Date.now,
  })
  createdAt?: Date;
}

export const ModuleSchema = SchemaFactory.createForClass(Module);

// Ensures moduleName uniqueness
ModuleSchema.index({ moduleName: 1 }, { unique: true });
