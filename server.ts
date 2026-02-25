import dotenv from 'dotenv';
import cors from 'cors';
import express, { Request, Response } from 'express';
import { startUserCreatedConsumer } from './src/messaging/consumer/userCreated.consumer';
import { startTicketCreatedConsumer } from './src/messaging/consumer/ticketCreated.consumer';
import startRabbit from './src/messaging/rabbit';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';


const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CeiVoice Email Service API',
      version: '1.0.0',
      description: 'Email messaging service for CeiVoice platform using RabbitMQ',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
  },
  apis: ['./server.ts'], // Since routes are in server.ts
};



/**
 * @swagger
 * components:
 *   schemas:
 *     QueueStatusResponse:
 *       type: object
 *       properties:
 *         queue:
 *           type: string
 *           description: The name of the queue
 *           example: "email.user.created"
 *         messageCount:
 *           type: integer
 *           description: Number of messages in the queue
 *           example: 5
 *         consumerCount:
 *           type: integer
 *           description: Number of consumers connected to the queue
 *           example: 1
 *     UserCreatedEvent:
 *       type: object
 *       description: Event published when a new user is created (used internally by RabbitMQ)
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the newly created user
 *           example: "123"
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the new user
 *           example: "user@example.com"
 *         confirmationToken:
 *           type: string
 *           description: Email confirmation token
 *           example: "abc123def456"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *           example: "Failed to check queue"
 */
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const specs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

(async () => {
  try {
      await startUserCreatedConsumer();
      console.log('UserCreated consumer started');
      await startTicketCreatedConsumer();
      console.log('TicketCreated consumer started');
  } catch (err) {
      console.error('Failed to start consumer', err);
  }
})();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`EmailService running on port ${PORT}`);
});

/**
 * @swagger
 * /queue-status:
 *   get:
 *     tags:
 *       - Queue Management
 *     summary: Check Email Queue Status
 *     description: Get the current status of the email queue including message count and consumer count
 *     responses:
 *       200:
 *         description: Queue status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QueueStatusResponse'
 *       500:
 *         description: Failed to check queue status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get('/queue-status', async (_req: Request, res: Response) => {
  try {
    const channel = await startRabbit();
    const q = await channel.checkQueue('email.user.created');
    res.json({
      queue: q.queue,
      messageCount: q.messageCount,
      consumerCount: q.consumerCount
    });
  } catch (err) {
    console.error('Queue status error:', err);
    res.status(500).json({ error: 'Failed to check queue' });
  }
});