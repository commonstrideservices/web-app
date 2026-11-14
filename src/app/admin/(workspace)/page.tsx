import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, CalendarClock, ClipboardList, UserRoundPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProspectList } from '@/features/prospects/components/prospect-list'
import { getDashboard } from '@/features/prospects/server/prospect-service'

export const metadata: Metadata = { title: 'Admin dashboard' }

export default async function DashboardPage() {
  const { metrics, recent } = await getDashboard()
  const cards = [
    { label: 'Total prospects', value: metrics.total, href: '/admin/prospects', Icon: Users },
    { label: 'Not contacted', value: metrics.not_contacted, href: '/admin/prospects?status=not_contacted', Icon: UserRoundPlus },
    { label: 'Follow-ups due', value: metrics.follow_ups_due, href: '/admin/prospects?due=1', Icon: CalendarClock },
    { label: 'Pending updates', value: metrics.pending_updates, href: '/admin/prospects?pending=1', Icon: ClipboardList },
  ]

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, href, Icon }) => <Link key={label} href={href} className="rounded-xl">
          <Card className="@container/card h-full bg-linear-to-t from-primary/5 to-card py-5 shadow-xs transition-colors hover:border-ring/50">
            <CardHeader className="px-5">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl tracking-tight tabular-nums @[250px]/card:text-3xl">{value}</CardTitle>
              <CardAction className="rounded-md border border-border p-1.5 text-muted-foreground">
                <Icon size={16} aria-hidden="true" />
              </CardAction>
            </CardHeader>
          </Card>
        </Link>)}
      </div>
      <Card className="gap-4 overflow-hidden pt-5 pb-0 shadow-xs">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Recent prospects</CardTitle>
          <Button asChild variant="outline" size="sm"><Link href="/admin/prospects">View all <ArrowUpRight aria-hidden="true" /></Link></Button>
        </CardHeader>
        <CardContent className="px-0"><ProspectList prospects={recent} emptyMessage="New inquiries will appear here." /></CardContent>
      </Card>
    </div>
  )
}
