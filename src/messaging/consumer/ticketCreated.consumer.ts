import amqp from 'amqplib';
import { QUEUES } from '../event';
import { sendTicketCreatedEmail } from '../../service/emailService';

export async function startTicketCreatedConsumer() {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await conn.createChannel();

    await channel.assertQueue(QUEUES.EMAIL, { durable: true });

    channel.prefetch(1);

    console.log(`[EmailService] Waiting for messages on queue "${QUEUES.EMAIL}"`);

    channel.consume(QUEUES.EMAIL, async (msg) => {
        if (!msg) return;

        try {
            const data = JSON.parse(msg.content.toString());

            if (data.type === 'ticket_created') {
                const { recipientEmail, recipientName, ticketId, ticketTitle, createdAt } = data;

                if (!recipientEmail || !recipientName || !ticketId || !ticketTitle || !createdAt) {
                    throw new Error('Missing required fields in ticket_created event');
                }

                await sendTicketCreatedEmail(
                    recipientEmail,
                    recipientName,
                    ticketId,
                    ticketTitle,
                    createdAt
                );

                console.log(`[EmailService] Ticket created email sent to ${recipientEmail} for ticket #${ticketId}`);
            } else {
                console.warn(`[EmailService] Unknown event type: ${data.type}`);
            }

            channel.ack(msg);
        } catch (err) {
            console.error('[EmailService] Failed to process ticket_created event:', (err as Error).message);
            channel.nack(msg, false, false);
        }
    });
}
