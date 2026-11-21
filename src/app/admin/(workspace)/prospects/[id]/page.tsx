import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminFeedback, AdminStatusBadge } from '@/features/admin/components/admin-status'
import { answerSnapshotSchema } from '@/features/intake/model'
import { ContactWorkflowForm, ReviewSubmissionForm } from '@/features/prospects/components/prospect-forms'
import { EmailVerification, formatTimestamp } from '@/features/prospects/components/prospect-list'
import { getProspect } from '@/features/prospects/server/prospect-service'
import type { Submission } from '@/lib/db/schema'

export const metadata: Metadata = { title: 'Prospect details' }

function Answers({ submission }: { submission: Submission }) {
  const parsed = answerSnapshotSchema.safeParse(submission.answers)
  if (!parsed.success) return <AdminFeedback tone="error">These answers could not be displayed.</AdminFeedback>
  return <dl className="divide-y divide-border">
    {parsed.data.map((answer) => <div className="grid gap-1 py-3 first:pt-0 last:pb-0" key={answer.id}>
      <dt className="text-sm font-semibold">{answer.prompt}</dt>
      <dd className="text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] text-muted-foreground">
        {answer.values.join(', ') || (answer.note ? '' : 'No answer')}
        {answer.note && <p className={answer.values.length ? 'mt-1' : undefined}>{answer.note}</p>}
      </dd>
    </div>)}
  </dl>
}

function ContactDetails({ submission, email }: { submission: Submission; email: string }) {
  const details = [
    { label: 'Name', value: submission.name },
    { label: 'Company', value: submission.company_name ?? '—' },
    { label: 'Phone', value: submission.phone },
    { label: 'Email', value: email },
  ]
  return <dl className="grid gap-3 text-sm sm:grid-cols-2">
    {details.map(({ label, value }) => <div className="min-w-0" key={label}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 [overflow-wrap:anywhere]">{value}</dd>
    </div>)}
  </dl>
}

export default async function ProspectPage({ params }: { params: Promise<{ id: string }> }) {
  const id = z.uuid().safeParse((await params).id)
  if (!id.success) notFound()
  const record = await getProspect(id.data)
  if (!record) notFound()

  const { prospect, submissions } = record
  const current = submissions.find((item) => item.id === prospect.current_submission_id)
  if (!current) notFound()
  const pending = submissions.filter((item) => item.review_status === 'pending')
  const past = submissions.filter((item) => item.id !== current.id && item.review_status !== 'pending')

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/prospects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={15} aria-hidden="true" /> Back to prospects
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-bold break-words tracking-tight">{current.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">First inquiry {formatTimestamp(prospect.created_at)}</p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="grid min-w-0 gap-6">
          <Card>
            <CardHeader><CardTitle>Current submission</CardTitle>
              <CardDescription><EmailVerification verifiedAt={current.email_verified_at} /></CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <ContactDetails submission={current} email={prospect.email} />
              <div className="border-t border-border pt-5"><Answers submission={current} /></div>
            </CardContent>
          </Card>
          {pending.length > 0 && <Card>
            <CardHeader><CardTitle>Pending updates</CardTitle>
              <CardDescription>Compare each proposed update with the current submission before applying it.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {pending.map((submission) => <details className="rounded-lg border border-border p-4" key={submission.id} open={pending.length === 1}>
                <summary className="cursor-pointer text-sm font-semibold">{formatTimestamp(submission.created_at)}</summary>
                <div className="mt-4 grid gap-4">
                  <div><EmailVerification verifiedAt={submission.email_verified_at} /></div>
                  <ContactDetails submission={submission} email={prospect.email} />
                  <Answers submission={submission} />
                  <ReviewSubmissionForm prospectId={prospect.id} submissionId={submission.id} currentId={current.id} />
                </div>
              </details>)}
            </CardContent>
          </Card>}
          {past.length > 0 && <Card>
            <CardHeader><CardTitle>Previous submissions</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              {past.map((submission) => <details className="rounded-lg border border-border p-4" key={submission.id}>
                <summary className="cursor-pointer text-sm font-semibold">
                  {formatTimestamp(submission.created_at)} {submission.review_status === 'dismissed'
                    ? <Badge variant="outline">Dismissed</Badge>
                    : <AdminStatusBadge tone="success">Previously applied</AdminStatusBadge>}
                </summary>
                <div className="mt-4 grid gap-4">
                  <div><EmailVerification verifiedAt={submission.email_verified_at} /></div>
                  <ContactDetails submission={submission} email={prospect.email} />
                  <Answers submission={submission} />
                </div>
              </details>)}
            </CardContent>
          </Card>}
        </div>
        <Card>
          <CardHeader><CardTitle>Contact workflow</CardTitle>
            <CardDescription>{prospect.last_contact_attempt_at ? `Last attempt ${formatTimestamp(prospect.last_contact_attempt_at)}` : 'No contact attempts recorded.'}</CardDescription>
          </CardHeader>
          <CardContent><ContactWorkflowForm prospect={prospect} /></CardContent>
        </Card>
      </div>
    </div>
  )
}
