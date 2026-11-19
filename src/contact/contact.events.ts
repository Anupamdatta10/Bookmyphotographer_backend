export const CONTACT_SUBMITTED_EVENT = "contact.submitted";

export interface ContactSubmittedEvent {
  submissionId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}
