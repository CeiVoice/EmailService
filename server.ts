import dotenv from 'dotenv';
import cors from 'cors';
import express, { Request, Response } from 'express';
import { startUserCreatedConsumer } from './src/messaging/consumer/userCreated.consumer';
import startRabbit from './src/messaging/rabbit';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

(async () => {
  try {
      await startUserCreatedConsumer();
      console.log('UserCreated consumer started');
  } catch (err) {
      console.error('Failed to start consumer', err);
  }
})();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`EmailService running on port ${PORT}`);
});

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