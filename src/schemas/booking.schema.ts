import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true, collection: 'bookings' })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'Photographer', required: true })
  photographerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  eventDate: Date;

  @Prop({ required: true, trim: true })
  eventLocation: string;

  @Prop({ type: String, enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Prop({ type: Number, default: 0, min: 0 })
  durationHours: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalPrice: number;

  @Prop({ type: String, default: '' })
  notes: string;

  @Prop({ type: String, default: '' })
  specialRequirements: string;

  @Prop({ type: Date })
  confirmedAt: Date;

  @Prop({ type: Date })
  completedAt: Date;

  @Prop({ type: String, default: '' })
  cancellationReason: string;

  @Prop({ type: Date })
  deletedAt: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Indexes for better query performance
BookingSchema.index({ photographerId: 1 });
BookingSchema.index({ userId: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ eventDate: 1 });
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ photographerId: 1, eventDate: 1 });
BookingSchema.index({ userId: 1, eventDate: 1 });
BookingSchema.index({ deletedAt: 1 });