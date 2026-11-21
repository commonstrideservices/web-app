'use client'

import { useActionState, useState, useTransition, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminActionFeedback } from '@/features/admin/components/admin-status'
import { maxTemplateHtmlLength, plainTemplateHtml } from '../config/template-layout'
import { EmailServerAction } from '../email-server-action'
import type { ConnectionSettings, EmailResult } from '../model'
import type { Mailbox } from '../server/settings'
import type { EmailTemplate } from '../server/templates'
import { Field, MailSelect, MailTextarea } from './fields'

const initialStatus: EmailResult = { ok: false, message: '' }

function SettingsForm({ action, children, label, resetOnSuccess }: {
  action: (previous: EmailResult, form: FormData) => Promise<EmailResult>
  children: ReactNode
  label: string
  resetOnSuccess?: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState(initialStatus)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    startTransition(async () => {
      try {
        const result = await action(initialStatus, data)
        setStatus(result)
        if (!result.ok) return
        if (resetOnSuccess) form.reset()
        const password = form.elements.namedItem('password')
        if (password instanceof HTMLInputElement) password.value = ''
      } catch {
        setStatus({ ok: false, message: 'The server could not be reached. Try again.' })
      }
    })
  }

  return <form method="post" onSubmit={submit} aria-busy={pending}>
    <fieldset disabled={pending} className="grid min-w-0 gap-4">
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">{pending ? 'Saving…' : label}</Button>
        <AdminActionFeedback {...status} />
      </div>
    </fieldset>
  </form>
}

export function MailboxForm({ mailbox, defaults, replacements }: {
  mailbox?: Mailbox
  defaults: ConnectionSettings
  replacements: { id: string; display_name: string }[]
}) {
  return <SettingsForm action={EmailServerAction.updateMailbox} label={mailbox ? 'Save mailbox' : 'Add mailbox'} resetOnSuccess={!mailbox}>
    <input type="hidden" name="id" value={mailbox?.id ?? ''} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Display name"><Input name="displayName" required maxLength={100} defaultValue={mailbox?.display_name} /></Field>
      <Field label="Email address"><Input name="address" type="email" required maxLength={254} defaultValue={mailbox?.address} /></Field>
      <Field label="Login username" help="Leave blank to use the mailbox email address.">
        <Input name="username" type="email" maxLength={254} defaultValue={mailbox?.username === mailbox?.address ? '' : mailbox?.username} />
      </Field>
      <Field label={mailbox ? 'Replace mailbox password' : 'Mailbox password'} help={mailbox ? 'Leave blank to keep the saved password.' : 'Use the password for this hosted mailbox.'}>
        <Input name="password" type="password" required={!mailbox} autoComplete="new-password" maxLength={1024} />
      </Field>
    </div>

    <fieldset className="grid min-w-0 gap-3 rounded-md border p-3">
      <legend className="px-1 text-sm font-medium">Porkbun connection settings</legend>
      <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
        <Field label="IMAP host"><Input name="imapHost" defaultValue={mailbox?.imap_host ?? defaults.imapHost} readOnly /></Field>
        <Field label="IMAP port"><Input name="imapPort" type="number" defaultValue={mailbox?.imap_port ?? defaults.imapPort} readOnly /></Field>
      </div>
      <p className="text-xs text-muted-foreground">Incoming mail uses TLS.</p>
      <Field label="SMTP host"><Input name="smtpHost" defaultValue={mailbox?.smtp_host ?? defaults.smtpHost} readOnly /></Field>
      <Field label="SMTP port and security">
        <MailSelect name="smtpPort" defaultValue={mailbox?.smtp_port ?? defaults.smtpPort}>
          <option value="587">587 · STARTTLS</option>
          <option value="465">465 · TLS</option>
          <option value="50587">50587 · STARTTLS</option>
        </MailSelect>
      </Field>
    </fieldset>

    <label className="flex min-h-9 items-center gap-2 text-sm font-medium">
      <input type="checkbox" name="enabled" className="size-4 accent-primary" defaultChecked={mailbox?.enabled ?? true} />
      Enabled in Email
    </label>
    {mailbox?.is_default && replacements.length > 0 && <Field label="Replacement default" help="Choose a replacement if disabling this mailbox.">
      <MailSelect name="replacementDefaultId">
        <option value="">Choose a mailbox</option>
        {replacements.map((replacement) => <option key={replacement.id} value={replacement.id}>{replacement.display_name}</option>)}
      </MailSelect>
    </Field>}
  </SettingsForm>
}

function MailboxCommand({ id, action, label, pendingLabel }: {
  id: string
  action: (previous: EmailResult, form: FormData) => Promise<EmailResult>
  label: string
  pendingLabel: string
}) {
  const [state, submit, pending] = useActionState(action, initialStatus)
  return <form action={submit} className="grid justify-items-start gap-2">
    <input name="id" type="hidden" value={id} />
    <Button size="sm" variant="outline" disabled={pending}>{pending ? pendingLabel : label}</Button>
    <AdminActionFeedback {...state} />
  </form>
}

export function MailboxCommands({ mailbox }: { mailbox: Mailbox }) {
  if (!mailbox.enabled) return null
  return <div className="flex flex-wrap items-start gap-2">
    {!mailbox.is_default && <MailboxCommand id={mailbox.id} action={EmailServerAction.makeDefault} label="Make default" pendingLabel="Saving…" />}
    <MailboxCommand id={mailbox.id} action={EmailServerAction.testMailbox} label="Test connection" pendingLabel="Testing…" />
  </div>
}

export function TemplateForm({ template }: { template?: EmailTemplate }) {
  return <SettingsForm action={EmailServerAction.updateTemplate} label={template ? 'Save template' : 'Add template'} resetOnSuccess={!template}>
    <input type="hidden" name="id" value={template?.id ?? ''} />
    <Field label="Template name"><Input name="name" required maxLength={100} defaultValue={template?.name} /></Field>
    <Field label="Email HTML" help="Place {{body}} once where the editable message belongs. Style the surrounding element to set the message font and alignment.">
      <MailTextarea name="html" required maxLength={maxTemplateHtmlLength} defaultValue={template?.html ?? plainTemplateHtml()}
        spellCheck={false} className="min-h-48 font-mono" />
    </Field>
    <Field label="Subject (optional)"><Input name="subject" maxLength={250} defaultValue={template?.subject} /></Field>
    <Field label="Starting message (optional)"><MailTextarea name="body" maxLength={30_000} defaultValue={template?.body} /></Field>
  </SettingsForm>
}

export function ProfessionalTemplateForm() {
  const [status, submit, pending] = useActionState(EmailServerAction.addProfessionalTemplate, initialStatus)
  return <form action={submit} className="grid justify-items-start gap-2">
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? 'Adding template…' : 'Add Common Stride template'}
    </Button>
    <AdminActionFeedback {...status} />
  </form>
}

export function DeleteTemplateForm({ template }: { template: EmailTemplate }) {
  const [confirming, setConfirming] = useState(false)
  const [status, submit, pending] = useActionState(EmailServerAction.deleteTemplate, initialStatus)
  return <div className="border-t pt-4">
    {confirming ? <form action={submit} className="grid gap-3" aria-busy={pending}>
      <input type="hidden" name="id" value={template.id} />
      <p className="wrap-anywhere text-sm">Delete “{template.name}”?</p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" variant="destructive" disabled={pending}>
          {pending ? 'Deleting…' : 'Confirm deletion'}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => setConfirming(false)}>Cancel</Button>
      </div>
      <AdminActionFeedback {...status} />
    </form> : <Button type="button" size="sm" variant="outline" onClick={() => setConfirming(true)}>Delete template</Button>}
  </div>
}
