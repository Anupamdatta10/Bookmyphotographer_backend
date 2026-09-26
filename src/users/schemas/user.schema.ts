import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  CLIENT = 'client',
  PHOTOGRAPHER = 'photographer',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.CLIENT })
  role: UserRole;

  @Prop({ type: String, default: '' })
  phone: string;

  @Prop({ type: String, default: '' })
  address: string;

  @Prop({ type: String, default: '' })
  profileImageUrl: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date })
  lastLoginAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Photographer' })
  photographerProfileId: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });