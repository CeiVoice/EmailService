import dotenv from 'dotenv';
import cors from 'cors';
import express, { Request, Response } from 'express';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY || '');

app.use(cors());
app.use(express.json());

app.post('/email', async (req: Request, res: Response) => {
  const { to, subject, html, text } = req.body;

  if (!to || !subject || (!html && !text)) {
    return res
      .status(400)
      .json({ message: 'to, subject and html or text are required' });
  }

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'no-reply@example.com',
      to,
      subject,
      html: html ?? `<p>${text}</p>`,
      text,
    });

    return res.status(200).json({ message: 'Email sent', result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to send email' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`EmailService running on port ${PORT}`);
});