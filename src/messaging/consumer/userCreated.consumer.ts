import startRabbit from '../rabbit'
import { EXCHANGES, ROUNTING_KEYS } from '../event'
import { sendConfirmationEmail } from '../../service/emailService'
import jwt from "jsonwebtoken"
import fs from "fs"
import path from "path"


const publicKey = fs.readFileSync(
  path.join(process.cwd(), "secrets", "identity_public_key.pem"),
  "utf8"
)
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
      const raw = JSON.parse(msg.content.toString())

      if (!raw.token) {
        throw new Error("missing token")
      }

      if (!publicKey) {
        throw new Error("missing public key")
      }

      const decoded = jwt.verify(
        raw.token,
        publicKey,
        { algorithms: ["RS256"] }
      ) as any

      if (decoded.service !== "identity_service") {
        throw new Error("invalid producer")
      }

      const { email, emailConfirmToken } = decoded.data

      if (!emailConfirmToken) {
        throw new Error("missing confirm token")
      }

      await sendConfirmationEmail(email, emailConfirmToken)

      channel.ack(msg)
    } catch (err) {
      console.error("consumer error:", (err as Error).message)
      channel.nack(msg, false, false)
    }
  })
}
