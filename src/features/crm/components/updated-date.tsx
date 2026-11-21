import { AdminStatusBadge } from '@/features/admin/components/admin-status'

const timeZone = process.env.APP_TIME_ZONE || 'Asia/Manila'
const shortDate = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeZone })
const fullDate = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone })

export function UpdatedDate({ timestamp, stale, detailed = false }: {
  timestamp: string; stale: boolean; detailed?: boolean
}) {
  const date = new Date(timestamp)
  return <div className="flex flex-wrap items-center gap-1.5 whitespace-nowrap">
    <time dateTime={date.toISOString()} title={fullDate.format(date)}>{(detailed ? fullDate : shortDate).format(date)}</time>
    {stale && <AdminStatusBadge tone="warning">Stale</AdminStatusBadge>}
  </div>
}
