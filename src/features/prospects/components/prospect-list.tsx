import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ProspectInboxRow } from '@/lib/db/schema'
import { contactStatusLabels } from '../model'

export function EmailVerification({ verifiedAt }: { verifiedAt: string | null }) {
  return <Badge variant="outline">{verifiedAt ? 'Verified' : 'Unverified'}</Badge>
}

export function formatDay(day: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(day))
}

export function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: process.env.APP_TIME_ZONE || 'Asia/Manila',
  }).format(new Date(timestamp))
}

export function ProspectList({ prospects, emptyMessage }: { prospects: ProspectInboxRow[]; emptyMessage: string }) {
  if (!prospects.length) return <p className="px-4 py-8 text-sm text-muted-foreground">{emptyMessage}</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Prospect contact and email verification statuses</caption>
        <thead className="border-y border-border bg-muted/50 text-xs font-medium text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">Prospect</th>
            <th scope="col" className="px-4 py-3">Contact status</th>
            <th scope="col" className="px-4 py-3">Email</th>
            <th scope="col" className="px-4 py-3">Follow-up date</th>
            <th scope="col" className="px-4 py-3">Pending updates</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {prospects.map((prospect) => <tr className="transition-colors hover:bg-muted/50" key={prospect.id}>
            <td className="min-w-44 px-4 py-3">
              <Link className="inline-flex items-center gap-1 font-semibold hover:underline" href={`/admin/prospects/${prospect.id}`}>
                {prospect.name} <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
              <p className="mt-0.5 max-w-64 break-all text-xs text-muted-foreground">{prospect.company_name || prospect.email}</p>
            </td>
            <td className="px-4 py-3"><Badge variant="secondary">{contactStatusLabels[prospect.contact_status]}</Badge></td>
            <td className="px-4 py-3"><EmailVerification verifiedAt={prospect.email_verified_at} /></td>
            <td className="px-4 py-3 whitespace-nowrap">{prospect.follow_up_on ? formatDay(prospect.follow_up_on) : '—'}</td>
            <td className="px-4 py-3">{prospect.pending_count || '—'}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  )
}
