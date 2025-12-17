import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

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