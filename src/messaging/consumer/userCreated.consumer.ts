import startRabbit from '../rabbit';
import { EXCHANGES,ROUNTING_KEYS } from '../event';
import { sendWelcomeEmail } from '../../service/emailService';

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

    try {
      console.log(
        'Send welcome email to:',
        event.data.email
      );

      await sendWelcomeEmail(event.data.email);

      channel.ack(msg);
    } catch (err) {
      console.error('Error sending email:', err);
      channel.nack(msg, false, false);
    }
  });
}
