import 'server-only'

import { ImapFlow, type FetchMessageObject } from 'imapflow'
import { convert } from 'html-to-text'
import { simpleParser } from 'mailparser'
import { folderPath, type MailboxView, type MailMessage, type MessageLocation } from '../model'
import { EmailError } from './access'
import { getMailboxConnection, type MailboxConnection } from './settings'

const PAGE_SIZE = 25
const MAX_MESSAGE_BYTES = 2_000_000

export async function withImap<T>(mailbox: MailboxConnection, operation: (client: ImapFlow) => Promise<T>) {
  const client = new ImapFlow({
    host: mailbox.connection.imapHost,
    port: mailbox.connection.imapPort,
    secure: true,
    auth: { user: mailbox.username, pass: mailbox.password },
    connectionTimeout: 8_000,
    greetingTimeout: 6_000,
    socketTimeout: 12_000,
    disableAutoIdle: true,
    logger: false,
  })
  // Socket failures also reject the associated command. Keep provider details out of app logs.
  client.on('error', () => {})
  try {
    await client.connect()
    return await operation(client)
  } finally {
    client.close()
  }
}

async function listFolders(client: ImapFlow) {
  return (await client.list()).filter(({ flags, path }) => !flags.has('\\Noselect') && folderPath.safeParse(path).success)
    .map(({ path, name, specialUse }) => ({ path, name, specialUse }))
    .sort((a, b) => Number(b.path === 'INBOX') - Number(a.path === 'INBOX'))
}

function summary(message: FetchMessageObject, folder: string, validity: string) {
  const envelope = message.envelope
  const date = new Date(envelope?.date ?? message.internalDate ?? '')
  return {
    location: { folder, uid: message.uid, validity },
    from: envelope?.from?.[0]?.address?.slice(0, 254) ?? '',
    fromName: envelope?.from?.[0]?.name?.slice(0, 160) ?? '',
    to: envelope?.to?.slice(0, 12).map(({ address }) => address?.slice(0, 254) ?? '').filter(Boolean) ?? [],
    replyTo: (envelope?.replyTo?.[0]?.address ?? envelope?.from?.[0]?.address)?.slice(0, 254) ?? '',
    subject: envelope?.subject?.slice(0, 500) || '(No subject)',
    date: Number.isFinite(date.getTime()) ? date.toISOString() : null,
    unread: message.flags?.has('\\Seen') === false,
  }
}

async function fetchMessage(client: ImapFlow, location: MessageLocation, messageCount: number) {
  if (!messageCount) return null
  const [metadata] = await client.fetchAll(String(location.uid), { envelope: true, size: true, flags: true, internalDate: true }, { uid: true })
  if (!metadata || metadata.uid !== location.uid) return null
  const item = summary(metadata, location.folder, location.validity)
  if (metadata.size === undefined || metadata.size > MAX_MESSAGE_BYTES) {
    return { ...item, body: '', large: true, attachments: [] as string[] }
  }
  const [raw] = await client.fetchAll(String(location.uid), { source: { maxLength: MAX_MESSAGE_BYTES + 1 } }, { uid: true })
  if (raw?.uid !== location.uid || !raw.source) return null
  if (raw.source.length > MAX_MESSAGE_BYTES) return { ...item, body: '', large: true, attachments: [] as string[] }
  const mail = await simpleParser(raw.source, {
    skipHtmlToText: true,
    skipTextToHtml: true,
    skipImageLinks: true,
  })
  const body = mail.text || (mail.html ? convert(mail.html, {
    wordwrap: false,
    selectors: [{ selector: 'img', format: 'skip' }],
  }) : '')
  return {
    ...item,
    body: body.slice(0, 100_000),
    large: body.length > 100_000,
    attachments: mail.attachments.slice(0, 20).map((attachment) => attachment.filename?.slice(0, 160) || 'Attachment'),
  }
}

export async function readMailbox(id: string, requestedFolder: string, requestedPage: number): Promise<MailboxView> {
  return withImap(await getMailboxConnection(id), async (client) => {
    const folders = await listFolders(client)
    const folder = folders.find(({ path }) => path === requestedFolder) ?? folders[0]
    if (!folder) throw new EmailError('No folders are available for this mailbox.')
    const box = await client.mailboxOpen(folder.path, { readOnly: true })
    const pageCount = Math.max(1, Math.ceil(box.exists / PAGE_SIZE))
    const page = Math.min(requestedPage, pageCount)
    const end = box.exists - (page - 1) * PAGE_SIZE
    const start = Math.max(1, end - PAGE_SIZE + 1)
    const validity = String(box.uidValidity)
    const rows = end > 0 ? await client.fetchAll(`${start}:${end}`, {
      envelope: true, flags: true, internalDate: true,
    }) : []
    return {
      folders, folder, page, pageCount, validity,
      messages: rows.sort((a, b) => b.seq - a.seq).map((row) => summary(row, folder.path, validity)),
    }
  })
}

export async function readMailboxMessage(id: string, location: MessageLocation): Promise<MailMessage | null> {
  return withImap(await getMailboxConnection(id), async (client) => {
    const box = await client.mailboxOpen(location.folder, { readOnly: true })
    if (String(box.uidValidity) !== location.validity) return null
    return fetchMessage(client, location, box.exists)
  })
}

const messageIdPattern = /^<[^<>\s\u0000-\u001f\u007f]+>$/

export async function getReplyHeaders(mailboxId: string, location: MessageLocation) {
  return withImap(await getMailboxConnection(mailboxId), async (client) => {
    const box = await client.mailboxOpen(location.folder, { readOnly: true })
    if (!box.exists || String(box.uidValidity) !== location.validity) {
      throw new EmailError('The original message is unavailable. Reopen it before replying.')
    }
    const [source] = await client.fetchAll(String(location.uid), {
      envelope: true, headers: ['references'],
    }, { uid: true })
    if (!source || source.uid !== location.uid) throw new EmailError('The original message is unavailable.')
    const inReplyTo = source.envelope?.messageId
    const raw = source.headers?.toString('utf8').slice(0, 32_000) ?? ''
    const references = (raw.match(/<[^<>\s]+>/g) ?? [])
      .filter((value) => value.length <= 1_000 && messageIdPattern.test(value))
      .slice(-29)
    if (!inReplyTo || inReplyTo.length > 1_000 || !messageIdPattern.test(inReplyTo)) return { references }
    return { inReplyTo, references: [...new Set([...references, inReplyTo])] }
  })
}

export async function verifyImap(mailbox: MailboxConnection) {
  await withImap(mailbox, async (client) => {
    await client.mailboxOpen('INBOX', { readOnly: true })
  })
}

async function appendOnce(client: ImapFlow, path: string, messageId: string, raw: Buffer, flags: string[]) {
  const box = await client.mailboxOpen(path, { readOnly: true })
  if (box.exists) {
    const existing = await client.search({ header: { 'Message-ID': messageId } }, { uid: true })
    if (!Array.isArray(existing)) return false
    if (existing.length) return true
  }
  return Boolean(await client.append(path, raw, flags))
}

export async function appendMailboxDraft(mailbox: MailboxConnection, messageId: string, raw: Buffer) {
  return withImap(mailbox, async (client) => {
    const folders = await listFolders(client)
    const drafts = folders.find((folder) => folder.specialUse === '\\Drafts') ??
      folders.find((folder) => /^(drafts|draft)$/i.test(folder.name))
    if (!drafts) throw new EmailError('This mailbox does not expose a Drafts folder.')
    if (!await appendOnce(client, drafts.path, messageId, raw, ['\\Draft', '\\Seen'])) {
      throw new EmailError('The Drafts copy could not be confirmed. Try again.')
    }
    return drafts.path
  })
}

export async function archiveSentMessage(mailbox: MailboxConnection, messageId: string, raw: Buffer) {
  await withImap(mailbox, async (client) => {
    const folders = await listFolders(client)
    const sent = folders.find((folder) => folder.specialUse === '\\Sent') ??
      folders.find((folder) => /^(sent|sent mail|sent items)$/i.test(folder.name))
    if (!sent) throw new EmailError('This mailbox does not expose a Sent folder.')
    if (!await appendOnce(client, sent.path, messageId, raw, ['\\Seen'])) {
      throw new EmailError('Porkbun could not save the Sent copy.')
    }
  })
}

