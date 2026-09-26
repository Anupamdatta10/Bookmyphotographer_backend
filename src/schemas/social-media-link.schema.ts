import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SocialMediaLinkDocument = SocialMediaLink & Document;

@Schema({ timestamps: true, collection: 'socialMediaLinks' })
export class SocialMediaLink {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  link: string;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: String, default: '' })
  socialMediaName: string;

  @Prop({ type: String, default: '' })
  logo: string;
}

export const SocialMediaLinkSchema = SchemaFactory.createForClass(SocialMediaLink);

// Indexes
SocialMediaLinkSchema.index({ userId: 1 });
SocialMediaLinkSchema.index({ socialMediaName: 1 });
SocialMediaLinkSchema.index({ createdAt: -1 });
SocialMediaLinkSchema.index({ deletedAt: 1 });