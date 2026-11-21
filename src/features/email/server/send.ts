import 'server-only'

import { createHash } from 'node:crypto'
import { lt, sql } from 'drizzle-orm'
import nodemailer, { type SendMailOptions } from 'nodemailer'
import { emailSendAttempts } from '@/lib/db/schema'
import { getDatabase } from '@/lib/db/server'
import type { ComposeInput, EmailResult, SaveDraftInput } from '../model'
import { EmailError } from './access'
import { archiveSentMessage, appendMailboxDraft, getReplyHeaders, verifyImap } from './imap'
import { getMailboxConnection, type MailboxConnection } from './settings'
import { renderEmail } from './templates'

async function buildMime(options: SendMailOptions) {
  const mime = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'windows' })
  const compiled = await mime.sendMail(options)
  const raw: unknown = compiled.message
  if (!Buffer.isBuffer(raw)) throw new EmailError('The message could not be prepared.')
  return raw
}

function smtpTransport(mailbox: MailboxConnection) {
  const secure = mailbox.connection.smtpSecurity === 'tls'
  return nodemailer.createTransport({
    host: mailbox.connection.smtpHost,
    port: mailbox.connection.smtpPort,
    secure,
    requireTLS: !secure,
    auth: { user: mailbox.username, pass: mailbox.password },
    connectionTimeout: 8_000,
    greetingTimeout: 6_000,
    socketTimeout: 12_000,
    disableUrlAccess: true,
    disableFileAccess: true,
  })
}

export async function testMailbox(id: string) {
  const connection = await getMailboxConnection(id)
  try {
    await verifyImap(connection)
  } catch {
    throw new EmailError('Porkbun IMAP could not open Inbox. Check the mailbox login and password.')
  }
  const smtp = smtpTransport(connection)
  try {
    await smtp.verify()
  } catch {
    throw new EmailError('IMAP connected, but Porkbun SMTP could not verify the login. Check the outgoing port and password.')
  } finally {
    smtp.close()
  }
}

export async function saveMailboxDraft(staffId: string, input: SaveDraftInput) {
  const mailbox = await getMailboxConnection(input.mailboxId)
  const domain = mailbox.address.split('@').at(-1)
  const digest = createHash('sha256').update(JSON.stringify([staffId, mailbox.id, input])).digest('hex')
  const messageId = `<draft.${digest}@${domain}>`
  const content = await renderEmail(input.body, input.templateId, input.templateRevision)
  const reply = input.reply ? await getReplyHeaders(input.mailboxId, input.reply) : {}
  const raw = await buildMime({
    from: { name: mailbox.displayName, address: mailbox.address },
    to: input.to,
    cc: input.cc,
    bcc: input.bcc,
    subject: input.subject,
    ...content,
    ...reply,
    messageId,
  })
  return appendMailboxDraft(mailbox, messageId, raw)
}

export async function sendEmail(input: ComposeInput): Promise<EmailResult & { attempted: true }> {
  const mailbox = await getMailboxConnection(input.mailboxId)
  const domain = mailbox.address.split('@').at(-1)
  const messageId = `<${input.sendId}@${domain}>`
  const envelope = { from: mailbox.address, to: [...new Set([...input.to, ...input.cc, ...input.bcc])] }
  const content = await renderEmail(input.body, input.templateId, input.templateRevision)
  const reply = input.reply ? await getReplyHeaders(input.mailboxId, input.reply) : {}
  const raw = await buildMime({
    from: { name: mailbox.displayName, address: mailbox.address },
    to: input.to,
    cc: input.cc,
    // Bcc recipients go in the SMTP envelope only.
    subject: input.subject,
    ...content,
    ...reply,
    messageId,
  })
  const db = getDatabase()
  await db.delete(emailSendAttempts).where(lt(emailSendAttempts.created_at, sql`now() - interval '1 day'`))
  const [claim] = await db.insert(emailSendAttempts).values({ id: input.sendId })
    .onConflictDoNothing().returning({ id: emailSendAttempts.id })
  if (!claim) throw new EmailError('This send was already attempted. Check Sent or confirm delivery before sending again.')

  const smtp = smtpTransport(mailbox)
  let rejected: string[]
  try {
    const result = await smtp.sendMail({ envelope, raw })
    rejected = result.rejected?.map(String) ?? []
  } catch {
    return { ok: false, tone: 'warning', attempted: true, message: 'Porkbun did not confirm delivery. Check Sent or confirm with the recipient before trying again.' }
  } finally {
    smtp.close()
  }

  const warning = rejected.length
    ? `Porkbun accepted some recipients and rejected ${rejected.length}. Check the recipient addresses before following up.`
    : null
  try {
    await archiveSentMessage(mailbox, messageId, raw)
    return { ok: true, tone: warning ? 'warning' : undefined, attempted: true, message: warning ?? 'Message sent' }
  } catch {
    return { ok: true, tone: 'warning', attempted: true, message: `${warning ?? 'Message sent.'} The Sent copy could not be confirmed.` }
  }
}
