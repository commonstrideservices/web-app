import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

export type DirectoryMetric = { label: string; value: number }

export function DirectoryHeader({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3">
    <h1 className="min-w-0 wrap-anywhere font-heading text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
    {action}
  </div>
}

export function DirectoryPage({ title, action, metrics, children }: {
  title: string; action?: ReactNode; metrics: DirectoryMetric[]; children: ReactNode
}) {
  return <div className="grid min-w-0 gap-5">
    <DirectoryHeader title={title} action={action} />
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
      {metrics.map(({ label, value }) => <Card key={label} className="gap-1 px-3 py-3 sm:px-4 sm:py-4">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="text-2xl font-semibold tracking-tight tabular-nums">{value.toLocaleString('en-PH')}</dd>
      </Card>)}
    </dl>
    {children}
  </div>
}

export function DirectoryLoading({ title }: { title: string }) {
  return <div role="status" className="grid min-w-0 gap-5">
    <DirectoryHeader title={title} />
    <span className="sr-only">Loading directory…</span>
    <div aria-hidden="true" className="grid gap-4 motion-safe:animate-pulse">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
        {[1, 2, 3].map((item) => <Card key={item} className="h-20 bg-muted/50" />)}
      </div>
      <Card className="h-24 bg-muted/50" />
      <Card className="h-52 bg-muted/50" />
    </div>
  </div>
}
