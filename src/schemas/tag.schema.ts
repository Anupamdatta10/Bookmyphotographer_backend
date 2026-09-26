import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TagDocument = Tag & Document;

@Schema({ timestamps: true, collection: 'tags' })
export class Tag {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: Date })
  deletedAt: Date;
}

export const TagSchema = SchemaFactory.createForClass(Tag);

// Indexes
TagSchema.index({ name: 1 }, { unique: true });
TagSchema.index({ createdAt: -1 });
TagSchema.index({ deletedAt: 1 });