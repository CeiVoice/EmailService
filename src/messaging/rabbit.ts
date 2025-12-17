import amqp, { Channel } from 'amqplib'
import { EXCHANGES } from './event'
let channel: Channel | undefined

const startRabbit = async () => {
    if (channel) return channel

    const conn = await amqp.connect(process.env.RABBITMQ_URL || "")
    channel = await conn.createChannel()

    await channel.assertExchange(
        EXCHANGES.IDENTITY,
        'topic',
        { durable: true }
    )
    return channel
}

export default startRabbit