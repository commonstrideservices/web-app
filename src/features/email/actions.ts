'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { composeForm, mailboxForm, mailboxId, saveDraftForm, templateForm, templateId, type EmailResult } from './model'
import { emailErrorMessage, getEmailAdministrator } from './server/access'
import { saveMailboxDraft, sendEmail, testMailbox } from './server/send'
import { saveMailbox, setDefaultMailbox } from './server/settings'
import { addProfessionalTemplate, removeTemplate, saveTemplate } from './server/templates'

const settingsPath = '/admin/configuration/email'
const forbidden = { ok: false, message: 'Only administrators can use Email.' } as const

export async function updateEmailMailbox(_previous: EmailResult, form: FormData): Promise<EmailResult> {
  if (!await getEmailAdministrator()) return forbidden
  const smtpPort = Number(form.get('smtpPort'))
  const input = mailboxForm.safeParse({
    id: form.get('id') ?? '',
    displayName: form.get('displayName'),
    address: form.get('address'),
    username: form.get('username') ?? '',
    password: form.get('password') ?? '',
    enabled: form.get('enabled') === 'on',
    replacementDefaultId: form.get('replacementDefaultId') ?? '',
    connection: {
      provider: 'porkbun',
      imapHost: form.get('imapHost'),
      imapPort: Number(form.get('imapPort')),
      imapSecurity: 'tls',
      smtpHost: form.get('smtpHost'),
      smtpPort,
      smtpSecurity: smtpPort === 465 ? 'tls' : 'starttls',
    },
  })
  if (!input.success) return { ok: false, message: 'Check the mailbox address and Porkbun connection settings.' }
  try {
    await saveMailbox(input.data)
    revalidatePath(settingsPath)
    revalidatePath('/admin/email')
    return { ok: true, message: 'Mailbox saved.' }
  } catch (error) {
    return { ok: false, message: emailErrorMessage(error, 'The mailbox could not be saved.') }
  }
}

export async function makeEmailMailboxDefault(_previous: EmailResult, form: FormData): Promise<EmailResult> {
  if (!await getEmailAdministrator()) return forbidden
  const id = mailboxId.safeParse(form.get('id'))
  if (!id.success) return { ok: false, message: 'Choose an enabled mailbox.' }
  try {
    await setDefaultMailbox(id.data)
    revalidatePath(settingsPath)
    revalidatePath('/admin/email')
    return { ok: true, message: 'Default mailbox updated.' }
  } catch (error) {
    return { ok: false, message: emailErrorMessage(error, 'The default mailbox could not be updated.') }
  }
}

export async function testEmailMailbox(_previous: EmailResult, form: FormData): Promise<EmailResult> {
  if (!await getEmailAdministrator()) return forbidden
  const id = mailboxId.safeParse(form.get('id'))
  if (!id.success) return { ok: false, message: 'Choose an enabled mailbox.' }
  try {
    await testMailbox(id.data)
    return { ok: true, message: 'Porkbun IMAP and SMTP connected successfully.' }
  } catch (error) {
    return { ok: false, message: emailErrorMessage(error, 'The mailbox could not be tested.') }
  }
}

export async function updateEmailTemplate(_previous: EmailResult, form: FormData): Promise<EmailResult> {
  if (!await getEmailAdministrator()) return forbidden
  const input = templateForm.safeParse({
    id: form.get('id') ?? '',
    name: form.get('name'),
    subject: form.get('subject'),
    body: form.get('body'),
    html: form.get('html'),
  })
  if (!input.success) return { ok: false, message: 'Check the template name, HTML, subject, and message length.' }
  try {
    await saveTemplate(input.data)
    revalidatePath(settingsPath)
    revalidatePath('/admin/email')
    return { ok: true, message: 'Template saved.' }
  } catch (error) {
    return { ok: false, message: emailErrorMessage(error, 'The template could not be saved.') }
  }
}

export async function addProfessionalEmailTemplate(): Promise<EmailResult> {
  if (!await getEmailAdministrator()) return forbidden
  try {
    await addProfessionalTemplate()
    revalidatePath(settingsPath)
    revalidatePath('/admin/email')
    return { ok: true, message: 'Common Stride template added.' }
  } catch (error) {
    return { ok: false, message: emailErrorMessage(error, 'The Common Stride template could not be added.') }
  }
}

export async function deleteEmailTemplate(_previous: EmailResult, form: FormData): Promise<EmailResult> {
  if (!await getEmailAdministrator()) return forbidden
  const id = templateId.safeParse(form.get('id'))
  if (!id.success) return { ok: false, message: 'Choose a template to delete.' }
  try {
    await removeTemplate(id.data)
    revalidatePath(settingsPath)
    revalidatePath('/admin/email')
  } catch (error) {
    return { ok: false, message: emailErrorMessage(error, 'The template could not be deleted.') }
  }
  redirect(`${settingsPath}?section=templates`)
}

export async function saveEmailDraft(data: unknown): Promise<{ ok: true; message: string; folder: string } | { ok: false; message: string }> {
  const staff = await getEmailAdministrator()
  if (!staff) return forbidden
  const input = saveDraftForm.safeParse(data)
  if (!input.success) return { ok: false, message: 'Enter a recipient, subject, or message to save. Separate valid email addresses with commas.' }
  try {
    const folder = await saveMailboxDraft(staff.id, input.data)
    return { ok: true, message: 'Draft saved', folder }
  } catch (error) {
    return { ok: false, message: emailErrorMessage(error, 'The draft could not be saved. Try again.') }
  }
}

export async function sendEmailMessage(data: unknown): Promise<EmailResult & { attempted?: boolean }> {
  const staff = await getEmailAdministrator()
  if (!staff) return forbidden
  const input = composeForm.safeParse(data)
  if (!input.success) return { ok: false, message: 'Enter valid email addresses, a subject, and a message. Separate addresses with commas.' }
  try {
    return await sendEmail(input.data)
  } catch (error) {
    return { ok: false, message: emailErrorMessage(error, 'The message could not be sent.') }
  }
}
