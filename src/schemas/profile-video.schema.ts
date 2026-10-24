import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProfileVideoDocument = ProfileVideo & Document;

@Schema({ timestamps: true, collection: 'profile_videos' })
export class ProfileVideo {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0, max: 1 })
  slot: number;

  @Prop({ type: String, required: true, unique: true })
  videoName: string;

  @Prop({ type: String, required: true })
  originalName: string;

  @Prop({ type: String, required: true })
  videoUrl: string;
}

export const ProfileVideoSchema = SchemaFactory.createForClass(ProfileVideo);

ProfileVideoSchema.index({ userId: 1, slot: 1 }, { unique: true });
