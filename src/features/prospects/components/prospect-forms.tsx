'use client'

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { AdminActionFeedback } from '@/features/admin/components/admin-status'
import type { Prospect } from '@/lib/db/schema'
import { contactStatuses, contactStatusLabels } from '../model'
import { ProspectServerAction } from '../prospect-server-action'

export function ContactWorkflowForm({ prospect }: { prospect: Prospect }) {
  const [result, action, pending] = useActionState(ProspectServerAction.update, { message: '' })
  const attempt = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (result.ok && attempt.current) attempt.current.checked = false
  }, [result])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const data = new FormData(event.currentTarget)
    startTransition(() => action(data))
  }

  return <form method="post" onSubmit={submit} className="grid gap-4">
    <input type="hidden" name="prospectId" value={prospect.id} />
    <label className="grid gap-1.5 text-sm font-medium">Contact status
      <select className="admin-field" name="status" defaultValue={prospect.contact_status}>
        {contactStatuses.map((status) => <option key={status} value={status}>{contactStatusLabels[status]}</option>)}
      </select>
    </label>
    <label className="grid gap-1.5 text-sm font-medium">Next follow-up date
      <input className="admin-field" type="date" name="followUpOn" defaultValue={prospect.follow_up_on ?? ''} />
    </label>
    <label className="flex items-center gap-2 text-sm"><input ref={attempt} type="checkbox" name="recordAttempt" /> Record a contact attempt now</label>
    <label className="grid gap-1.5 text-sm font-medium">Internal notes
      <textarea className="admin-field" rows={5} maxLength={4000} name="notes" defaultValue={prospect.notes} />
    </label>
    <AdminActionFeedback {...result} />
    <div><Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save workflow'}</Button></div>
  </form>
}

export function ReviewSubmissionForm({ prospectId, submissionId, currentId }: {
  prospectId: string; submissionId: string; currentId: string
}) {
  const [result, action, pending] = useActionState(ProspectServerAction.review, { message: '' })
  return <form action={action} className="grid gap-3">
    <input type="hidden" name="prospectId" value={prospectId} />
    <input type="hidden" name="submissionId" value={submissionId} />
    <input type="hidden" name="expectedCurrentId" value={currentId} />
    <div className="flex flex-wrap gap-2">
      <Button type="submit" name="decision" value="apply" disabled={pending}>Apply update</Button>
      <Button type="submit" name="decision" value="dismiss" variant="outline" disabled={pending}>Dismiss update</Button>
    </div>
    <AdminActionFeedback {...result} />
  </form>
}
