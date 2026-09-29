import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RegistrationOtpDocument = RegistrationOtp & Document;

@Schema({ collection: 'registration_otps' })
export class RegistrationOtp {
  @Prop({ required: true, lowercase: true, trim: true, unique: true })
  email: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const RegistrationOtpSchema = SchemaFactory.createForClass(RegistrationOtp);
RegistrationOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });