import startRabbit from '../rabbit';
import { EXCHANGES,ROUNTING_KEYS } from '../event';
import { sendConfirmationEmail } from '../../service/emailService';

export async function startUserCreatedConsumer() {
  const channel = await startRabbit();

  const { queue } = await channel.assertQueue(
    'email.user.created',
    { durable: true }
  );

  await channel.bindQueue(
    queue,
    EXCHANGES.IDENTITY,
    ROUNTING_KEYS.USER_CREATED
  );

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());
    
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
      const { email, emailConfirmToken } = event.data;
      
      console.log('Email:', email);
      console.log('Token exists:', !!emailConfirmToken);
      
      if (!emailConfirmToken) {
        console.warn('No emailConfirmToken in event data');
        channel.ack(msg);
        return;
      }
      
      console.log(
        'Sending confirmation email to:',
        email
      );

      await sendConfirmationEmail(email, emailConfirmToken);

      channel.ack(msg);
    } catch (err) {
      console.error('Error sending email:', err);
      channel.nack(msg, false, false);
    }
  });
}
