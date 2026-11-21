import 'server-only'

import { randomUUID } from 'node:crypto'
import { and, asc, eq, ne, sql } from 'drizzle-orm'
import { getDatabase } from '@/lib/db/server'
import { appSettings, emailMailboxCredentials, emailMailboxes } from '@/lib/db/schema'
import { connectionSettings, type MailboxInput } from '../model'
import { EmailError } from './access'
import { decryptMailboxPassword, encryptMailboxPassword } from './credentials'

export async function getEmailConnectionDefaults() {
  const [setting] = await getDatabase().select().from(appSettings)
    .where(eq(appSettings.key, 'email.connection_defaults'))
  if (setting?.schema_version !== 1) throw new EmailError('The email connection preset is unavailable.')
  return connectionSettings.parse(setting.value)
}

export function listMailboxes() {
  return getDatabase().select().from(emailMailboxes)
    .orderBy(sql`${emailMailboxes.is_default} desc`, asc(emailMailboxes.display_name), asc(emailMailboxes.id))
}

export async function saveMailbox(input: MailboxInput) {
  const id = input.id ?? randomUUID()
  const password = input.password ? encryptMailboxPassword(id, input.password) : null
  if (!input.id && !password) throw new EmailError('Enter the password for the hosted mailbox.')

  await getDatabase().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(19372, 1)`)
    const [existing] = await tx.select().from(emailMailboxes).where(eq(emailMailboxes.id, id))
    if (input.id && !existing) throw new EmailError('This mailbox could not be found.')
    const [duplicate] = await tx.select({ id: emailMailboxes.id }).from(emailMailboxes)
      .where(and(eq(emailMailboxes.address, input.address), ne(emailMailboxes.id, id)))
    if (duplicate) throw new EmailError('A mailbox with this email address already exists.')
    const username = input.username || input.address
    if (existing && (existing.username !== username || existing.address !== input.address) && !password) {
      throw new EmailError('Re-enter the mailbox password when changing its address or login.')
    }

    const [currentDefault] = await tx.select({ id: emailMailboxes.id }).from(emailMailboxes)
      .where(eq(emailMailboxes.is_default, true))
    const connection = input.connection
    const values = {
      address: input.address,
      display_name: input.displayName,
      username,
      provider: connection.provider,
      imap_host: connection.imapHost,
      imap_port: connection.imapPort,
      imap_security: connection.imapSecurity,
      smtp_host: connection.smtpHost,
      smtp_port: connection.smtpPort,
      smtp_security: connection.smtpSecurity,
      enabled: input.enabled,
      is_default: input.enabled && (!currentDefault || currentDefault.id === id),
      updated_at: sql`now()`,
    }
    if (existing) await tx.update(emailMailboxes).set(values).where(eq(emailMailboxes.id, id))
    else await tx.insert(emailMailboxes).values({ id, ...values })

    if (existing?.is_default && !input.enabled) {
      const remaining = await tx.select({ id: emailMailboxes.id }).from(emailMailboxes)
        .where(eq(emailMailboxes.enabled, true))
      if (remaining.length) {
        if (!remaining.some((mailbox) => mailbox.id === input.replacementDefaultId)) {
          throw new EmailError('Choose a replacement default before disabling this mailbox.')
        }
        await tx.update(emailMailboxes).set({ is_default: true, updated_at: sql`now()` })
          .where(eq(emailMailboxes.id, input.replacementDefaultId!))
      }
    }

    if (password) {
      await tx.insert(emailMailboxCredentials).values({ mailbox_id: id, ...password })
        .onConflictDoUpdate({ target: emailMailboxCredentials.mailbox_id, set: password })
    }
  })
}

export async function setDefaultMailbox(id: string) {
  await getDatabase().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(19372, 1)`)
    const [mailbox] = await tx.select({ enabled: emailMailboxes.enabled, isDefault: emailMailboxes.is_default })
      .from(emailMailboxes).where(eq(emailMailboxes.id, id))
    if (!mailbox?.enabled) throw new EmailError('Choose an enabled mailbox.')
    if (mailbox.isDefault) return
    await tx.update(emailMailboxes).set({ is_default: false, updated_at: sql`now()` })
      .where(eq(emailMailboxes.is_default, true))
    await tx.update(emailMailboxes).set({ is_default: true, updated_at: sql`now()` })
      .where(eq(emailMailboxes.id, id))
  })
}

export async function getMailboxConnection(id: string) {
  const [record] = await getDatabase().select({ mailbox: emailMailboxes, credential: emailMailboxCredentials })
    .from(emailMailboxes).innerJoin(emailMailboxCredentials, eq(emailMailboxCredentials.mailbox_id, emailMailboxes.id))
    .where(and(eq(emailMailboxes.id, id), eq(emailMailboxes.enabled, true)))
  if (!record) throw new EmailError('This mailbox is disabled or its password is missing.')
  const { mailbox, credential } = record
  const connection = connectionSettings.safeParse({
    provider: mailbox.provider,
    imapHost: mailbox.imap_host,
    imapPort: mailbox.imap_port,
    imapSecurity: mailbox.imap_security,
    smtpHost: mailbox.smtp_host,
    smtpPort: mailbox.smtp_port,
    smtpSecurity: mailbox.smtp_security,
  })
  if (!connection.success) throw new EmailError('Check the Porkbun connection settings for this mailbox.')
  return {
    id: mailbox.id,
    address: mailbox.address,
    displayName: mailbox.display_name,
    connection: connection.data,
    username: mailbox.username,
    password: decryptMailboxPassword(mailbox.id, credential.encrypted_password, credential.key_version),
  }
}

export type Mailbox = typeof emailMailboxes.$inferSelect
export type MailboxConnection = Awaited<ReturnType<typeof getMailboxConnection>>
