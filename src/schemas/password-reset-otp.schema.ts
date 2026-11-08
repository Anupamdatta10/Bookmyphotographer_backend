import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PasswordResetOtpDocument = PasswordResetOtp & Document;

@Schema({ collection: 'password_reset_otps' })
export class PasswordResetOtp {
  @Prop({ required: true, lowercase: true, trim: true, unique: true })
  email: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const PasswordResetOtpSchema = SchemaFactory.createForClass(PasswordResetOtp);
PasswordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
