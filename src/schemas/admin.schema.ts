import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;

export enum AdminType {
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN',
}

@Schema({ timestamps: true, collection: 'admins' })
export class Admin {
  @Prop({ type: String, required: true, trim: true, minlength: 2, maxlength: 100 })
  name: string;

  @Prop({ type: String, required: true, trim: true, lowercase: true, unique: true })
  email: string;

  @Prop({ type: String, required: true, select: false })
  password: string;

  @Prop({ type: String, enum: AdminType, default: AdminType.ADMIN, required: true })
  type: AdminType;

  @Prop({ type: String, default: null, trim: true })
  phone: string | null;

  @Prop({ type: String, default: null, trim: true })
  country: string | null;

  @Prop({ type: String, default: null, trim: true })
  state: string | null;

  @Prop({ type: String, default: null, trim: true })
  city: string | null;

  @Prop({ type: String, default: null, trim: true })
  address: string | null;

  @Prop({ type: String, default: null, trim: true })
  profileImageUrl: string | null;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

AdminSchema.set('toJSON', {
  transform: (_document, result) => {
    delete (result as Partial<Admin>).password;
    return result;
  },
});

AdminSchema.index({ deletedAt: 1 });