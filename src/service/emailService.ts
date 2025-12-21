import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'no-reply@example.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log('Email sent successfully:', result);
    return result;
  } catch (err) {
    console.error('Failed to send email:', err);
    throw err;
  }
}

export async function sendConfirmationEmail(email: string, token: string) {
  try {
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost';
    const confirmLink = `${baseUrl}/auth/confirm-email/${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #333; margin: 0 0 10px 0;">Welcome to CeiVoice!</h1>
          <p style="color: #666; margin: 0;">Thank you for signing up. Please confirm your email address to get started.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmLink}" style="
            display: inline-block;
            padding: 12px 30px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
          ">Confirm Email Address</a>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Or copy and paste this link:</p>
          <p style="color: #0066cc; margin: 0; word-break: break-all; font-size: 12px;">${confirmLink}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            This confirmation link will expire in 24 hours.
          </p>
          <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      </div>
    `;

    return sendEmail({
      to: email,
      subject: 'Confirm Your Email - CeiVoice',
      html: html
    });
  } catch (err) {
    console.error('Failed to send confirmation email:', err);
    throw err;
  }
}

export async function sendWelcomeEmail(email: string) {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'no-reply@example.com',
      to: email,
      subject: 'Welcome to CeiVoice!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to CeiVoice!</h1>
          <p>Thank you for creating an account with us.</p>
          <p>We're excited to have you on board.</p>
        </div>
      `,
    });

    console.log('Welcome email sent successfully:', result);
    return result;
  } catch (err) {
    console.error('Failed to send welcome email:', err);
    throw err;
  }
}