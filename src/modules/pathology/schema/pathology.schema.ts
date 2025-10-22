// schemas/pathology.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PathologyDocument = Pathology & Document;

@Schema({ timestamps: true })
export class Pathology {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  pathologyName: string;

  @Prop({
    type: String,
    default: null,
    trim: true,
  })
  description?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Module',
    required: true,
  })
  moduleId: Types.ObjectId;

  @Prop({
    type: String,
    default: null,
    trim: true,
  })
  imageUrl?: string;

  @Prop({
    type: Date,
    default: Date.now,
  })
  createdAt?: Date;
}

export const PathologySchema = SchemaFactory.createForClass(Pathology);

// Add indexes if needed
PathologySchema.index({ moduleId: 1 });
PathologySchema.index({ pathologyName: 1 });
