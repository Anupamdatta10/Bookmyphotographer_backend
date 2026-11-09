import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContactSubmissionDocument = ContactSubmission & Document;

@Schema({ timestamps: true, collection: 'contact_submissions' })
export class ContactSubmission {
  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, maxlength: 254 })
  email: string;

  @Prop({ required: true, trim: true, maxlength: 150 })
  subject: string;

  @Prop({ required: true, trim: true, maxlength: 5000 })
  message: string;
}

export const ContactSubmissionSchema =
  SchemaFactory.createForClass(ContactSubmission);

ContactSubmissionSchema.index({ createdAt: -1 });
