import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PhotographerDocument = Photographer & Document;

@Schema({ timestamps: true, collection: 'photographers' })
export class Photographer {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, unique: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  address: string;

  @Prop({ type: [String], default: [] })
  specialties: string[];

  @Prop({ type: String, default: '' })
  bio: string;

  @Prop({ type: Number, default: 0, min: 0 })
  experienceYears: number;

  @Prop({ type: Number, default: 0, min: 0 })
  pricePerHour: number;

  @Prop({ type: String, default: '' })
  portfolioUrl: string;

  @Prop({ type: String, default: '' })
  profileImageUrl: string;

  @Prop({ type: Boolean, default: true })
  isAvailable: boolean;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ type: Number, default: 0 })
  totalReviews: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Date })
  deletedAt: Date;
}

export const PhotographerSchema = SchemaFactory.createForClass(Photographer);

// Indexes for better query performance
PhotographerSchema.index({ email: 1 }, { unique: true });
PhotographerSchema.index({ specialties: 1 });
PhotographerSchema.index({ isAvailable: 1 });
PhotographerSchema.index({ rating: -1 });
PhotographerSchema.index({ pricePerHour: 1 });
PhotographerSchema.index({ createdAt: -1 });
PhotographerSchema.index({ deletedAt: 1 });