import { z } from 'zod'
import { maxTemplateHtmlLength } from './config/template-layout'

export const mailboxId = z.uuid()
const optionalId = z.union([z.uuid(), z.literal('')]).transform((value) => value || null)
const address = z.string().trim().max(254).pipe(z.email())
const singleLine = (max: number) => z.string().trim().max(max).refine((value) => !/\p{Cc}/u.test(value))
const name = singleLine(100).min(1)
export const composeLimits = { recipients: 1_500, subject: 250, body: 30_000 } as const
export const composeBodyPlaceholder = 'Type your message here...'
const body = z.string().trim().max(composeLimits.body)

export const connectionSettings = z.object({
  provider: z.literal('porkbun'),
  imapHost: z.literal('imap.porkbun.com'),
  imapPort: z.literal(993),
  imapSecurity: z.literal('tls'),
  smtpHost: z.literal('smtp.porkbun.com'),
  smtpPort: z.union([z.literal(465), z.literal(587), z.literal(50587)]),
  smtpSecurity: z.enum(['tls', 'starttls']),
}).refine(({ smtpPort, smtpSecurity }) => (smtpPort === 465) === (smtpSecurity === 'tls'))

export const mailboxForm = z.object({
  id: optionalId,
  displayName: name,
  address: address.transform((value) => value.toLowerCase()),
  username: z.union([address, z.literal('')]),
  password: z.string().max(1024),
  enabled: z.boolean(),
  replacementDefaultId: optionalId,
  connection: connectionSettings,
})

export const templateId = z.uuid()

export const templateForm = z.object({
  id: optionalId,
  name,
  subject: singleLine(250),
  body,
  html: z.string().trim().min(1).max(maxTemplateHtmlLength),
})

export const folderPath = z.string().min(1).max(512).refine((value) => !/[\u0000\r\n]/.test(value))
export const positiveUid = z.number().int().min(1).max(4_294_967_295)
export const uidValidity = z.string().regex(/^[1-9]\d{0,9}$/)
export const messageLocation = z.object({ folder: folderPath, uid: positiveUid, validity: uidValidity })

export const mailMessageSummary = z.object({
  location: messageLocation, from: z.string(), fromName: z.string(), to: z.array(z.string()),
  replyTo: z.string(), subject: z.string(), date: z.iso.datetime().nullable(), unread: z.boolean(),
})
export const mailMessage = mailMessageSummary.extend({ body: z.string(), large: z.boolean(), attachments: z.array(z.string()) })
const mailFolder = z.object({ path: folderPath, name: z.string(), specialUse: z.string().optional() })
export const mailboxView = z.object({
  folders: z.array(mailFolder), folder: mailFolder, page: z.number().int().positive(),
  pageCount: z.number().int().positive(), validity: uidValidity, messages: z.array(mailMessageSummary),
})
export type MailMessage = z.infer<typeof mailMessage>
export type MailMessageSummary = z.infer<typeof mailMessageSummary>
export type MailboxView = z.infer<typeof mailboxView>

export function readMailLocation(params: Pick<URLSearchParams, 'get'>) {
  const uid = params.get('uid')
  const parsed = messageLocation.safeParse({
    folder: params.get('folder'), validity: params.get('validity'),
    uid: uid && /^\d{1,10}$/.test(uid) ? Number(uid) : null,
  })
  return parsed.success ? parsed.data : null
}

export function readMailPage(value: string | null) {
  return value && /^\d{1,6}$/.test(value) ? Math.max(1, Number(value)) : 1
}

const recipientList = z.string().max(composeLimits.recipients)
  .transform((value) => value.split(',').map((entry) => entry.trim()).filter(Boolean))
const messageFields = z.object({
  mailboxId,
  cc: recipientList.pipe(z.array(address).max(5)),
  bcc: recipientList.pipe(z.array(address).max(5)),
  templateId: optionalId,
  templateRevision: z.string().regex(/^[0-9a-f]{64}$/).nullable(),
  reply: messageLocation.nullable(),
})
export const composeForm = messageFields.extend({
  sendId: z.uuid(),
  to: recipientList.pipe(z.array(address).min(1).max(5)),
  subject: singleLine(composeLimits.subject).min(1),
  body: body.min(1),
})
export const saveDraftForm = messageFields.extend({
  saveId: z.uuid(),
  to: recipientList.pipe(z.array(address).max(5)),
  subject: singleLine(composeLimits.subject),
  body,
}).refine(({ to, cc, bcc, subject, body }) => Boolean(to.length || cc.length || bcc.length || subject || body))

export type ConnectionSettings = z.infer<typeof connectionSettings>
export type MailboxInput = z.infer<typeof mailboxForm>
export type TemplateInput = z.infer<typeof templateForm>
export type ComposeInput = z.infer<typeof composeForm>
export type SaveDraftInput = z.infer<typeof saveDraftForm>
export type MessageLocation = z.infer<typeof messageLocation>
export type ComposeReply = { to: string; subject: string; location: MessageLocation }
export type TemplateSummary = { id: string; name: string; subject: string; body: string }
export type ComposeTemplate = TemplateSummary & { layout: string; revision: string }
export type ComposeLibrary = {
  templates: ComposeTemplate[]
}
export type EmailResult = { message: string; ok: boolean; tone?: 'warning' }

function mailQuery(mailbox: string, folder: string, page: number, message?: MessageLocation) {
  const query = new URLSearchParams({ mailbox, folder })
  if (page > 1) query.set('page', String(page))
  if (message) {
    query.set('uid', String(message.uid))
    query.set('validity', message.validity)
  }
  return query.toString()
}

export function mailHref(mailbox: string, folder = 'INBOX', page = 1, message?: MessageLocation) {
  return `/admin/email?${mailQuery(mailbox, folder, page, message)}`
}

export function mailDataHref(mailbox: string, folder: string, page = 1, message?: MessageLocation) {
  return `/admin/email/data?${mailQuery(mailbox, folder, page, message)}`
}
