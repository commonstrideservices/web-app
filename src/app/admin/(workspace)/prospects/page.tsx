import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProspectList } from '@/features/prospects/components/prospect-list'
import { contactStatuses, contactStatusLabels, inboxFiltersSchema } from '@/features/prospects/model'
import { listProspects } from '@/features/prospects/server/prospect-service'

export const metadata: Metadata = { title: 'Prospects' }

export default async function ProspectsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = inboxFiltersSchema.parse(await searchParams)
  const { prospects, total, pageCount } = await listProspects(filters)
  const { page, ...criteria } = filters

  function pageUrl(nextPage: number) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(criteria)) if (value) params.set(key, value)
    params.set('page', String(nextPage))
    return `/admin/prospects?${params}`
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-4xl font-bold tracking-tight">Prospects</h1>
        <p className="mt-2 text-sm text-muted-foreground">Review inquiries and keep track of follow-ups.</p>
      </div>
      <Card>
        <CardContent>
          <form action="/admin/prospects" method="get" className="flex flex-wrap items-end gap-3">
            <label className="grid min-w-40 gap-1.5 text-sm font-medium">Contact status
              <select className="admin-field" name="status" defaultValue={filters.status ?? ''}>
                <option value="">All statuses</option>
                {contactStatuses.map((status) => <option key={status} value={status}>{contactStatusLabels[status]}</option>)}
              </select>
            </label>
            <label className="grid min-w-40 gap-1.5 text-sm font-medium">Email verification
              <select className="admin-field" name="verification" defaultValue={filters.verification ?? ''}>
                <option value="">All submissions</option><option value="verified">Verified</option><option value="unverified">Unverified</option>
              </select>
            </label>
            <label className="flex min-h-9 items-center gap-2 text-sm"><input type="checkbox" name="due" value="1" defaultChecked={Boolean(filters.due)} /> Follow-up due</label>
            <label className="flex min-h-9 items-center gap-2 text-sm"><input type="checkbox" name="pending" value="1" defaultChecked={Boolean(filters.pending)} /> Pending updates</label>
            <Button type="submit">Apply filters</Button>
            <Button variant="ghost" asChild><Link href="/admin/prospects">Clear</Link></Button>
          </form>
        </CardContent>
      </Card>
      <Card className="gap-0 overflow-hidden py-0">
        <CardContent className="px-0">
          <ProspectList prospects={prospects} emptyMessage={Object.values(criteria).some(Boolean) ? 'No prospects match these filters.' : 'No prospects yet.'} />
        </CardContent>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-sm text-muted-foreground">
          <p>{total} {total === 1 ? 'prospect' : 'prospects'}</p>
          {(pageCount > 1 || page > 1) && <nav className="flex items-center gap-3" aria-label="Prospect pages">
            {page > 1 && <Button asChild variant="outline" size="sm"><Link href={pageUrl(Math.min(page - 1, pageCount))}>Previous</Link></Button>}
            <span>Page {page} of {pageCount}</span>
            {page < pageCount && <Button asChild variant="outline" size="sm"><Link href={pageUrl(page + 1)}>Next</Link></Button>}
          </nav>}
        </div>
      </Card>
    </div>
  )
}
