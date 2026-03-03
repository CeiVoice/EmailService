import startRabbit from '../rabbit'
import { EXCHANGES, ROUNTING_KEYS } from '../event'
import { sendConfirmationEmail } from '../../service/emailService'

export async function startUserCreatedConsumer() {
  const channel = await startRabbit()

  const { queue } = await channel.assertQueue(
    'email.user.created',
    { durable: true }
  )

  await channel.bindQueue(
    queue,
    EXCHANGES.IDENTITY,
    ROUNTING_KEYS.USER_CREATED
  )

  channel.consume(queue, async (msg) => {
    if (!msg) return

    try {
      const { email, emailConfirmToken } = JSON.parse(msg.content.toString())

      if (!email || !emailConfirmToken) {
        throw new Error("missing email or confirm token")
      }

      await sendConfirmationEmail(email, emailConfirmToken)

      channel.ack(msg)
    } catch (err) {
      console.error("consumer error:", (err as Error).message)
      channel.nack(msg, false, false)
    }
  })
}
