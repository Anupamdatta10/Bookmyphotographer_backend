import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import {
  ContactSubmission,
  ContactSubmissionDocument,
} from '../schemas/contact-submission.schema';
import { CreateContactSubmissionDto } from './dto/create-contact-submission.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(ContactSubmission.name)
    private readonly contactSubmissionModel: Model<ContactSubmissionDocument>,
    private readonly configService: ConfigService,
  ) {}

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async create(
    submission: CreateContactSubmissionDto,
  ): Promise<{ message: string }> {
    const savedSubmission = await new this.contactSubmissionModel(
      submission,
    ).save();
    const sender = this.configService.get<string>('EMAIL');
    const password = this.configService.get<string>('EMAIL_PASSWORD');

    if (!sender || !password) {
      console.error(
        `Contact notification email was not sent for submission ${savedSubmission.id}: email settings are missing`,
      );
      throw new ServiceUnavailableException(
        'Your message was saved, but we could not send the notification email. Please contact us directly.',
      );
    }

    const name = this.escapeHtml(savedSubmission.name);
    const email = this.escapeHtml(savedSubmission.email);
    const subject = this.escapeHtml(savedSubmission.subject);
    const message = this.escapeHtml(savedSubmission.message).replace(
      /\n/g,
      '<br>',
    );

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: sender, pass: password },
      });
      await transporter.sendMail({
        from: { name: 'BookMyFotographer Contact Form', address: sender },
        to: sender,
        replyTo: savedSubmission.email,
        subject: 'New contact form submission',
        text: [
          `Name: ${savedSubmission.name}`,
          `Email: ${savedSubmission.email}`,
          `Subject: ${savedSubmission.subject}`,
          '',
          'Message:',
          savedSubmission.message,
        ].join('\n'),
        html: `
          <h2>New contact form submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      });
    } catch (error) {
      console.error(
        `Contact notification email failed for submission ${savedSubmission.id}:`,
        error,
      );
      throw new ServiceUnavailableException(
        'Your message was saved, but we could not send the notification email. Please contact us directly.',
      );
    }

    return { message: 'Your message has been sent successfully.' };
  }
}
