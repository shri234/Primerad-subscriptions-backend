import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User &
  Document & {
    comparePassword(candidatePassword: string): Promise<boolean>;
  };

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Invalid email address'],
  })
  email: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({
    required: true,
    unique: true,
    match: [/^\d{10}$/, 'Invalid mobile number'],
  })
  mobileNumber: string;

  @Prop({ trim: true })
  designation?: string;

  @Prop({
    type: String,
    enum: ['user', 'admin', 'faculty'],
    default: 'user',
  })
  role: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    type: Object,
    default:  {
    name: '',
    type: '',
    status: 'inactive',
    expiryDate: null,
  },
  })
  subscription?: {
    name?:string;
    type?: string;
    status?: string;
    expiryDate?: Date;
  };

  @Prop({ type: [String], default: [] })
  allowedModules?: string[];

  @Prop({ type: [String], default: [] })
  allowedPathologies?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.pre<UserDocument>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for efficient queries
UserSchema.index({ email: 1 });
UserSchema.index({ mobileNumber: 1 });
UserSchema.index({ role: 1 });
