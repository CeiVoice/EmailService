import amqp from 'amqplib';
import { QUEUES } from '../event';
import { sendTicketCreatedEmail, sendAssignedEmail, sendStatusChangedEmail } from '../../service/emailService';

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
                await sendTicketCreatedEmail(recipientEmail, recipientName, ticketId, ticketTitle, createdAt);
                console.log(`[EmailService] Ticket created email sent to ${recipientEmail} for ticket #${ticketId}`);

            } else if (data.type === 'ticket_assigned') {
                const { recipientEmail, recipientName, ticketId, ticketTitle, assignedAt } = data;
                if (!recipientEmail || !recipientName || !ticketId || !ticketTitle || !assignedAt) {
                    throw new Error('Missing required fields in ticket_assigned event');
                }
                await sendAssignedEmail(recipientEmail, recipientName, ticketId, ticketTitle, assignedAt);
                console.log(`[EmailService] Assigned email sent to ${recipientEmail} for ticket #${ticketId}`);

            } else if (data.type === 'ticket_status_changed') {
                const { recipientEmail, recipientName, ticketId, ticketTitle, newStatus, changedAt } = data;
                if (!recipientEmail || !recipientName || !ticketId || !ticketTitle || !newStatus || !changedAt) {
                    throw new Error('Missing required fields in ticket_status_changed event');
                }
                await sendStatusChangedEmail(recipientEmail, recipientName, ticketId, ticketTitle, newStatus, changedAt);
                console.log(`[EmailService] Status changed email sent to ${recipientEmail} for ticket #${ticketId} → ${newStatus}`);

            } else {
                console.warn(`[EmailService] Unknown event type: ${data.type}`);
            }

            channel.ack(msg);
        } catch (err) {
            console.error('[EmailService] Failed to process event:', (err as Error).message);
            channel.nack(msg, false, false);
        }
    });
}
