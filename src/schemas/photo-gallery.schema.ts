import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PhotoGalleryDocument = PhotoGallery & Document;

@Schema({ timestamps: true, collection: 'photoGalleries' })
export class PhotoGallery {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  link: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: Boolean, default: false })
  isProfileImage: boolean;

  @Prop({ type: Number, default: 0 })
  sequence: number;

  @Prop({ type: Date })
  deletedAt: Date;
}

export const PhotoGallerySchema = SchemaFactory.createForClass(PhotoGallery);

// Indexes
PhotoGallerySchema.index({ userId: 1 });
PhotoGallerySchema.index({ isProfileImage: 1 });
PhotoGallerySchema.index({ sequence: 1 });
PhotoGallerySchema.index({ createdAt: -1 });
PhotoGallerySchema.index({ deletedAt: 1 });