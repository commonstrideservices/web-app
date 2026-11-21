import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { DirectoryHeader } from '@/features/admin/components/directory-page'
import { AdminFeedback } from '@/features/admin/components/admin-status'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function RecordHeader({ title, from, backLabel, action, children, saved = false }: {
  title: string; from: string; backLabel: string; action?: ReactNode; children?: ReactNode; saved?: boolean
}) {
  return <header className="grid min-w-0 gap-3">
    <Link href={from} className="inline-flex min-h-10 w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
      <ArrowLeft aria-hidden="true" className="size-4" />{backLabel}
    </Link>
    <DirectoryHeader title={title} action={action} />
    {children}
    {saved && <AdminFeedback tone="success">Record saved.</AdminFeedback>}
  </header>
}

export function RecordDetails({ title, fields, emptyMessage }: {
  title: string; fields: [label: string, value: ReactNode][]; emptyMessage?: string
}) {
  const present = fields.filter(([, value]) => value !== null && value !== undefined && value !== '')
  return <Card className="min-w-0 gap-4 py-4 sm:py-5">
    <CardHeader className="px-4 sm:px-5"><CardTitle><h2>{title}</h2></CardTitle></CardHeader>
    <CardContent className="px-4 sm:px-5">
      {present.length ? <dl className="grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
        {present.map(([label, value]) => <div key={label} className={label === 'Internal notes' ? 'sm:col-span-2' : undefined}>
          <dt className="mb-0.5 font-medium text-muted-foreground">{label}</dt>
          <dd className="min-w-0 whitespace-pre-wrap wrap-anywhere">{value}</dd>
        </div>)}
      </dl> : <p className="text-sm text-muted-foreground">{emptyMessage}</p>}
    </CardContent>
  </Card>
}

export const recordLinkClass = 'font-medium underline underline-offset-4 hover:text-primary'

export function webLink(value?: string | null, label?: string) {
  if (!value) return
  const url = URL.parse(value)
  if (!url || !['http:', 'https:'].includes(url.protocol)) return value
  return <a href={url.href} className={recordLinkClass} target="_blank" rel="noopener noreferrer">{label ?? value}</a>
}

export function mailLink(value?: string | null) {
  if (value) return <a href={`mailto:${value}`} className={recordLinkClass}>{value}</a>
}
