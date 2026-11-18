import nodemailer from 'nodemailer';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Imap = require('imap');
import { simpleParser } from 'mailparser';

// Email configuration (read at call time so NestJS ConfigModule has loaded .env)
const getSenderEmail = () => process.env.EMAIL || 'Your Titan email address';
const getSenderPassword = () => process.env.EMAIL_PASSWORD || 'Your Titan password';

// SMTP (sending) server details
const smtpServer = 'smtpout.secureserver.net';
const smtpPort = 465;

// IMAP (receiving) server details
const imapServer = 'imap.secureserver.net';
const imapPort = 993;

export async function sendEmailAndAppend(to: string, subject: string, text: string, html?: string) {
  try {
    // Create a nodemailer transporter using SMTP
    const transporter = nodemailer.createTransport({
      host: smtpServer,
      port: smtpPort,
      auth: {
        user: getSenderEmail(),
        pass: getSenderPassword(),
      },
    });

    // Create the email options
    const mailOptions = {
      from: getSenderEmail(),
      to: to,
      subject: subject,
      text: text,
      ...(html ? { html } : {}),
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    // console.log('Email sent successfully.');
    // console.log('Info object:', info);

    // Append the sent email to the "Sent" folder using IMAP
    const imap = new Imap({
      user: getSenderEmail() || '',
      password: getSenderPassword() || '',
      host: imapServer,
      port: imapPort,
      tls: true,
    });

    imap.once('ready', () => {
      imap.openBox('Sent', true, (err: any) => {
        if (err) {
          console.error('Error opening "Sent" folder:', err);
          imap.end();
          return;
        }

        // Create the email message as MIMEText
        const emailMessage = `From: ${getSenderEmail()}\r\nTo: ${to}\r\nSubject: ${subject}\r\n\r\n${text}`;

        // Append the sent email to the "Sent" folder
        imap.append(emailMessage, { mailbox: 'Sent' }, (appendErr: any) => {
          if (appendErr) {
            console.error('Error appending email to "Sent" folder:', appendErr);
          } else {
            console.log('Email appended to "Sent" folder.');
          }
          imap.end();
        });
      });
    });

    imap.once('error', (imapErr: any) => {
      console.error('IMAP Error:', imapErr);
    });

    imap.connect();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
