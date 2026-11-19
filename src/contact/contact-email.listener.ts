import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { sendEmailAndAppend } from '../helper/email.helper';
import {
  CONTACT_SUBMITTED_EVENT,
  ContactSubmittedEvent,
} from './contact.events';

@Injectable()
export class ContactEmailListener {
  constructor(private readonly configService: ConfigService) {}

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  @OnEvent(CONTACT_SUBMITTED_EVENT)
  async sendNotification(event: ContactSubmittedEvent): Promise<void> {
    const sender = this.configService.get<string>('EMAIL');
    const password = this.configService.get<string>('EMAIL_PASSWORD');
    if (!sender || !password) {
      console.error(
        `Contact notification email was not sent for submission ${event.submissionId}: email settings are missing`,
      );
      return;
    }

    const text = [
      `Name: ${event.name}`,
      `Email: ${event.email}`,
      `Subject: ${event.subject}`,
      '',
      'Message:',
      event.message,
    ].join('\n');
    const html = `
      <h2>New contact form submission</h2>
      <p><strong>Name:</strong> ${this.escapeHtml(event.name)}</p>
      <p><strong>Email:</strong> ${this.escapeHtml(event.email)}</p>
      <p><strong>Subject:</strong> ${this.escapeHtml(event.subject)}</p>
      <p><strong>Message:</strong></p>
      <p>${this.escapeHtml(event.message).replace(/\n/g, '<br>')}</p>
    `;

    try {
      await sendEmailAndAppend(
        sender,
        'New contact form submission',
        text,
        html,
      );
    } catch (error) {
      console.error(
        `Contact notification email failed for submission ${event.submissionId}:`,
        error,
      );
    }
  }
}
