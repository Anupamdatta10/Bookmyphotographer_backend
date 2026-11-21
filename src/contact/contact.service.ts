import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ContactSubmission,
  ContactSubmissionDocument,
} from '../schemas/contact-submission.schema';
import { CreateContactSubmissionDto } from './dto/create-contact-submission.dto';
import {
  CONTACT_SUBMITTED_EVENT,
  ContactSubmittedEvent,
} from './contact.events';

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(ContactSubmission.name)
    private readonly contactSubmissionModel: Model<ContactSubmissionDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    submission: CreateContactSubmissionDto,
  ): Promise<{ message: string }> {
    const savedSubmission = await new this.contactSubmissionModel(
      submission,
    ).save();
    const event: ContactSubmittedEvent = {
      submissionId: savedSubmission.id,
      name: savedSubmission.name,
      email: savedSubmission.email,
      phone: savedSubmission.phone,
      subject: savedSubmission.subject,
      message: savedSubmission.message,
    };
    this.eventEmitter.emit(CONTACT_SUBMITTED_EVENT, event);

    return { message: 'Your message has been received successfully.' };
  }
}
