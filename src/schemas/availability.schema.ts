import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AvailabilityDocument = Availability & Document;

@Schema({ timestamps: true, collection: 'availabilities' })
export class Availability {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  bookDate: Date;

  @Prop({ type: Date })
  deletedAt: Date;
}

export const AvailabilitySchema = SchemaFactory.createForClass(Availability);

// Indexes
AvailabilitySchema.index({ userId: 1 });
AvailabilitySchema.index({ bookDate: 1 });
AvailabilitySchema.index({ userId: 1, bookDate: 1 }, { unique: true });
AvailabilitySchema.index({ createdAt: -1 });
AvailabilitySchema.index({ deletedAt: 1 });