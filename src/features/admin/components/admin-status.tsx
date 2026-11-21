import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusStyles = {
  success: { Icon: CircleCheck, colors: 'border-success-border bg-success-surface text-success' },
  warning: { Icon: TriangleAlert, colors: 'border-warning-border bg-warning-surface text-warning' },
  error: { Icon: CircleAlert, colors: 'border-error-border bg-error-surface text-error' },
  info: { Icon: Info, colors: 'border-info-border bg-info-surface text-info' },
} as const

type StatusTone = keyof typeof statusStyles

export function AdminFeedback({ tone, children, className }: {
  tone: StatusTone
  children: ReactNode
  className?: string
}) {
  const { Icon, colors } = statusStyles[tone]
  return <div role={tone === 'error' ? 'alert' : 'status'} data-status={tone}
    className={cn('flex min-w-0 items-start gap-2 rounded-md border px-3 py-2 text-sm leading-5', colors, className)}>
    <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
    <div className="min-w-0 wrap-anywhere">{children}</div>
  </div>
}

export function AdminActionFeedback({ message, ok, tone, className }: {
  message: string
  ok?: boolean
  tone?: StatusTone
  className?: string
}) {
  if (!message) return null
  return <AdminFeedback tone={tone ?? (ok ? 'success' : 'error')} className={className}>{message}</AdminFeedback>
}

export function AdminStatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  const { Icon, colors } = statusStyles[tone]
  return <Badge variant="outline" data-status={tone} className={cn(colors, 'transition-none')}>
    <Icon aria-hidden="true" />{children}
  </Badge>
}
