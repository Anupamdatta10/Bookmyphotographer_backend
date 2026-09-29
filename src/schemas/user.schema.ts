import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'ADMIN',
  PHOTOGRAPHER = 'PHOTOGRAPHER',
  PARTNER = 'PARTNER',
  SUPERADMIN = 'SUPERADMIN',
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.PARTNER })
  type: UserRole;

  @Prop({ type: String, default: '' })
  phone: string | null;

  @Prop({ type: String, default: '' })
  country: string | null;

  @Prop({ type: String, default: '' })
  state: string | null;

  @Prop({ type: String, default: '' })
  city: string | null;

  @Prop({ type: String, default: '' })
  address1: string | null;

  @Prop({ type: String, default: '' })
  address2: string | null;

  @Prop({ type: String, default: '' })
  profileImageUrl: string | null;

  @Prop({ type: [String], default: [] })
  specialties: string[];

  @Prop({ type: String, default: '' })
  bio: string;

  @Prop({ type: String, default: '' })
  about: string;

  @Prop({ type: Number, default: 0, min: 0 })
  experienceYears: number;

  @Prop({ type: String, default: '' })
  portfolioUrl: string;

  @Prop({ type: String, default: '' })
  proffession: string;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ type: Number })
  pincode: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalReviews: number;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;
  

  @Prop({ type: Date })
  dob: Date;


  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  })
  location: {
    type: 'Point';
    coordinates: [number, number];
  } | null;

  @Prop({ type: Date })
  deletedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  transform: (_document, result) => {
    delete (result as Partial<User>).password;
    return result;
  },
});

// Indexes
UserSchema.index({ type: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ specialties: 1 });
UserSchema.index({ isAvailable: 1 });
UserSchema.index({ rating: -1 });
UserSchema.index({ pricePerHour: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ deletedAt: 1 });