'use client'

import { useRef, useState, useTransition, type FormEvent } from 'react'
import { FilePlus2, Maximize2, Minimize2, Monitor, Send, Smartphone, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminActionFeedback, AdminFeedback } from '@/features/admin/components/admin-status'
import { cn } from '@/lib/utils'
import { EmailServerAction } from '../email-server-action'
import { composeBodyPlaceholder, composeLimits, type ComposeLibrary, type ComposeReply, type EmailResult } from '../model'
import { readCachedCompose, writeCachedCompose, type ComposeFields } from './compose-cache'
import { Field, MailSelect, MailTextarea } from './fields'
import { TemplateBodyEditor } from './template-body-editor'

const emptyStatus: EmailResult = { ok: false, message: '' }

export function ComposeEmail({ mailbox, library, reply, cacheKey, titleId, fullscreen, onFullscreenChange, onClose, onDiscard, onAttempt,
  onDraftSaved, onSent }: {
  mailbox: { id: string; address: string }
  library: ComposeLibrary | null | undefined
  reply?: ComposeReply
  cacheKey: string
  titleId?: string
  fullscreen: boolean
  onFullscreenChange: (fullscreen: boolean) => void
  onClose: () => void
  onDiscard: () => void
  onAttempt: () => void
  onDraftSaved: (folder: string) => void
  onSent: (message: string) => void
}) {
  const [cached, setCached] = useState(() => readCachedCompose(cacheKey, reply))
  const { fields, saveId } = cached
  const { to, cc, bcc, subject, body, templateId } = fields
  const [showCopies, setShowCopies] = useState(() => Boolean(cc || bcc))
  const [phone, setPhone] = useState(false)
  const [status, setStatus] = useState(emptyStatus)
  const [attempted, setAttempted] = useState(false)
  const [sending, startSend] = useTransition()
  const [savingDraft, startDraftSave] = useTransition()
  const sendId = useRef<string | null>(null)

  const template = library?.templates.find((option) => option.id === templateId)
  const templatePending = Boolean(templateId) && library === undefined
  const templateUnavailable = Boolean(templateId) && !template
  const messageInput = { ...fields, mailboxId: mailbox.id, templateRevision: template?.revision ?? null, reply: reply?.location ?? null }
  const busy = sending || savingDraft
  const readonly = busy || attempted
  const fullscreenLabel = fullscreen ? 'Restore standard compose' : 'Fullscreen compose'
  const FullscreenIcon = fullscreen ? Minimize2 : Maximize2
  const canSaveDraft = [to, cc, bcc, subject, body].some((value) => value.trim())

  function updateFields(changes: Partial<ComposeFields>) {
    const next = { fields: { ...fields, ...changes }, saveId: null }
    setCached(next)
    writeCachedCompose(cacheKey, next)
    if (status.message) setStatus(emptyStatus)
  }

  function selectTemplate(id: string) {
    const selected = library?.templates.find((option) => option.id === id)
    updateFields({
      templateId: selected?.id ?? '',
      subject: subject || selected?.subject || '',
      body: body || selected?.body || '',
    })
  }

  function saveDraft() {
    const next = { fields, saveId: saveId ?? crypto.randomUUID() }
    setCached(next)
    writeCachedCompose(cacheKey, next)
    setStatus(emptyStatus)
    startDraftSave(async () => {
      try {
        const result = await EmailServerAction.saveDraft({ ...messageInput, saveId: next.saveId })
        setStatus(result)
        if (result.ok) onDraftSaved(result.folder)
      } catch {
        setStatus({ ok: false, message: 'The draft could not be saved. Try again.' })
      }
    })
  }

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readonly || templateUnavailable || !body.trim()) return
    const id = sendId.current ??= crypto.randomUUID()
    setStatus(emptyStatus)
    startSend(async () => {
      try {
        const result = await EmailServerAction.sendMessage({ ...messageInput, sendId: id })
        if (result.attempted) writeCachedCompose(cacheKey, null)
        if (result.attempted && result.ok && !result.tone) {
          onSent(result.message)
          return
        }
        setStatus(result)
        if (result.attempted) {
          setAttempted(true)
          onAttempt()
        }
      } catch {
        writeCachedCompose(cacheKey, null)
        setAttempted(true)
        onAttempt()
        setStatus({ ok: false, tone: 'warning', message: 'Delivery could not be confirmed. Check Sent before trying again.' })
      }
    })
  }

  return <section className={cn('flex w-full min-w-0 flex-col', fullscreen ? 'min-h-full' : 'sm:w-[min(44rem,calc(100vw-2rem))]')}>
    <header className="sticky top-0 z-10 flex min-h-12 shrink-0 items-center justify-between gap-2 border-b bg-card px-4 py-1.5">
      <h2 id={titleId} className="text-sm font-semibold">{reply ? 'Reply' : 'New message'}</h2>
      <div className="flex items-center gap-1">
        <Button type="button" size="icon" variant="ghost" aria-label={fullscreenLabel} title={fullscreenLabel}
          onClick={() => onFullscreenChange(!fullscreen)}><FullscreenIcon aria-hidden="true" /></Button>
        {!attempted && <Button type="button" variant="ghost" size="icon" aria-label="Discard draft" title="Discard draft"
          disabled={busy} onClick={() => {
            writeCachedCompose(cacheKey, null)
            onDiscard()
          }}><Trash2 aria-hidden="true" /></Button>}
        <Button type="button" variant="ghost" size="icon" aria-label="Close compose" title="Close compose" data-compose-close
          onClick={onClose}><X aria-hidden="true" /></Button>
      </div>
    </header>
    <form method="post" onSubmit={send} aria-busy={busy} className="flex flex-1 flex-col">
      <fieldset className="grid min-w-0 flex-1 content-start gap-4 p-4" disabled={readonly}>
        <p className="break-words text-sm text-muted-foreground">From {mailbox.address}</p>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
          <Field label="To" help={showCopies ? 'Separate multiple addresses with commas.' : undefined}>
            <Input value={to} onChange={(event) => updateFields({ to: event.target.value })} type="email" multiple required
              maxLength={composeLimits.recipients} data-compose-focus={reply ? undefined : ''} />
          </Field>
          {!showCopies && <Button type="button" variant="ghost" onClick={() => setShowCopies(true)}>Cc / Bcc</Button>}
        </div>
        {showCopies && <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cc"><Input value={cc} onChange={(event) => updateFields({ cc: event.target.value })} type="email" multiple
            maxLength={composeLimits.recipients} /></Field>
          <Field label="Bcc"><Input value={bcc} onChange={(event) => updateFields({ bcc: event.target.value })} type="email" multiple
            maxLength={composeLimits.recipients} /></Field>
        </div>}
        {(Boolean(library?.templates.length) || templateId) && <Field label="Template">
          <MailSelect value={templateId} onChange={(event) => selectTemplate(event.target.value)}>
            <option value="">No template</option>
            {templateUnavailable && <option value={templateId} disabled>{templatePending ? 'Loading template…' : 'Unavailable template'}</option>}
            {library?.templates.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
          </MailSelect>
        </Field>}
        {library === null && <AdminFeedback tone="warning">Templates are temporarily unavailable.</AdminFeedback>}
        {templateUnavailable && !templatePending && library && <AdminFeedback tone="warning">
          Choose another template or No template to continue.
        </AdminFeedback>}
        <Field label="Subject"><Input value={subject} onChange={(event) => updateFields({ subject: event.target.value })} required
          maxLength={composeLimits.subject} /></Field>
        {template ? <div className="grid min-w-0 gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Message</span>
            <div className="flex gap-2" role="group" aria-label="Template width">
              <Button type="button" size="icon" variant={phone ? 'secondary' : 'outline'} aria-label="Phone view"
                title="Phone view" aria-pressed={phone} onClick={() => setPhone(true)}><Smartphone aria-hidden="true" /></Button>
              <Button type="button" size="icon" variant={phone ? 'outline' : 'secondary'} aria-label="Desktop view"
                title="Desktop view" aria-pressed={!phone} onClick={() => setPhone(false)}><Monitor aria-hidden="true" /></Button>
            </div>
          </div>
          <TemplateBodyEditor key={template.revision} layout={template.layout} phone={phone} body={body} readOnly={readonly}
            onBodyChange={(value) => updateFields({ body: value })} />
        </div> : <Field label="Message">
          <MailTextarea value={body} onChange={(event) => updateFields({ body: event.target.value })} required
            className="min-h-40 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:outline-none!"
            placeholder={composeBodyPlaceholder} maxLength={composeLimits.body} data-compose-focus={reply ? '' : undefined} />
        </Field>}
      </fieldset>
      <div className="sticky bottom-0 z-10 grid gap-2 border-t bg-card p-4">
        {!attempted && <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={busy || templateUnavailable || !body.trim()}>
            <Send aria-hidden="true" />{sending ? 'Sending…' : 'Send'}
          </Button>
          <Button type="button" variant="outline" disabled={busy || templateUnavailable || !canSaveDraft} onClick={saveDraft}>
            <FilePlus2 aria-hidden="true" />{savingDraft ? 'Saving draft…' : 'Add to Drafts'}
          </Button>
        </div>}
        <AdminActionFeedback {...status} />
      </div>
    </form>
  </section>
}
