import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TagUserRelationDocument = TagUserRelation & Document;

@Schema({ timestamps: true, collection: 'tagUserRelations' })
export class TagUserRelation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tag', required: true })
  tagId: Types.ObjectId;

  @Prop({ type: Date })
  deletedAt: Date;
}

export const TagUserRelationSchema = SchemaFactory.createForClass(TagUserRelation);

// Indexes
TagUserRelationSchema.index({ userId: 1 });
TagUserRelationSchema.index({ tagId: 1 });
TagUserRelationSchema.index({ userId: 1, tagId: 1 }, { unique: true });
TagUserRelationSchema.index({ createdAt: -1 });
TagUserRelationSchema.index({ deletedAt: 1 });