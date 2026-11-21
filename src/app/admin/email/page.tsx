import type { Metadata } from 'next'
import { Brand } from '@/features/site/components/brand'
import { MailWorkspace } from '@/features/email/components/mail-workspace'
import { mailDataHref, readMailLocation } from '@/features/email/model'
import { requireEmailAdministrator } from '@/features/email/server/access'
import { readMailboxMessage } from '@/features/email/server/imap'
import { listMailboxes } from '@/features/email/server/settings'
import { getComposeLibrary } from '@/features/email/server/templates'

export const metadata: Metadata = { title: 'Email' }
export const runtime = 'nodejs'

export default async function EmailPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const staff = await requireEmailAdministrator()
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === 'string') params.set(key, value)
  }

  const mailboxes = (await listMailboxes()).filter((mailbox) => mailbox.enabled)
    .map(({ id, address, display_name }) => ({ id, address, displayName: display_name }))
  const mailbox = mailboxes.find((item) => item.id === params.get('mailbox')) ?? mailboxes[0]
  const library = mailbox ? getComposeLibrary() : Promise.resolve(null)
  const location = params.get('mailbox') === mailbox?.id ? readMailLocation(params) : null
  const message = params.get('compose') === 'reply' && mailbox && location
    ? await readMailboxMessage(mailbox.id, location).catch(() => null) : null
  const initialReply = message?.replyTo ? {
    to: message.replyTo, subject: (/^re:/i.test(message.subject) ? message.subject : `Re: ${message.subject}`).slice(0, 250),
    location: message.location,
  } : undefined

  return <MailWorkspace key={staff.id} staffId={staff.id} mailboxes={mailboxes} library={library} brand={<Brand href="/admin" compact />}
    initialMessage={mailbox && message ? { key: mailDataHref(mailbox.id, message.location.folder, 1, message.location), data: message } : undefined}
    initialCompose={params.get('compose') === 'new' || Boolean(initialReply)} initialReply={initialReply}
    timeZone={process.env.APP_TIME_ZONE || 'Asia/Manila'} />
}
