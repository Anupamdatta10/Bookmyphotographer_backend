import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PartnerCompanyDocument = PartnerCompany & Document;

export enum PartnerCompanyStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
}

@Schema({ timestamps: true, collection: 'partnerCompanies' })
export class PartnerCompany {
  @Prop({ type: String, required: true, trim: true, maxlength: 80 })
  name: string;

  @Prop({ type: String, default: '★', trim: true, maxlength: 8 })
  icon: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  description: string;

  @Prop({ type: String, default: '', trim: true, maxlength: 2048 })
  facebookUrl: string;

  @Prop({ type: String, default: '', trim: true, maxlength: 2048 })
  instagramUrl: string;

  @Prop({ type: String, default: '', trim: true, maxlength: 2048 })
  linkedinUrl: string;

  @Prop({ type: String, enum: PartnerCompanyStatus, default: PartnerCompanyStatus.DRAFT })
  status: PartnerCompanyStatus;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const PartnerCompanySchema = SchemaFactory.createForClass(PartnerCompany);

PartnerCompanySchema.index({ status: 1, createdAt: -1 });
PartnerCompanySchema.index({ deletedAt: 1 });