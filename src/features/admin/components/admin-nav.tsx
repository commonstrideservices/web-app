'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, LayoutDashboard, Mail, Settings2, Users, UserRoundCog } from 'lucide-react'

const items = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/prospects', label: 'Prospects', icon: Users },
  { href: '/admin/accounts', label: 'Staff accounts', icon: UserRoundCog, admin: true },
]

export function AdminNav({ administrator }: { administrator: boolean }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin navigation" className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap gap-1 md:grid">
        {items.filter((item) => !item.admin || administrator).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href + '/'))
          return <Link key={href} href={href} aria-current={active ? 'page' : undefined}
            className={`flex min-h-8 items-center gap-2 rounded-md px-2.5 text-sm transition-colors ${active ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
            <Icon size={16} aria-hidden="true" /> {label}
          </Link>
        })}
      </div>
      {administrator && (
        <div className="grid gap-1 border-t border-sidebar-border pt-3 md:mt-auto">
          <p className="px-2.5 text-xs font-medium text-muted-foreground">Tools</p>
          <Link href="/admin/email" target="_blank" rel="noopener" prefetch={false}
            className="flex min-h-9 items-center gap-2 rounded-md px-2.5 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Mail size={16} aria-hidden="true" /> Email <ExternalLink size={13} className="ms-auto" aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </Link>
          <Link href="/admin/configuration" prefetch={false}
            className="flex min-h-9 items-center gap-2 rounded-md px-2.5 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Settings2 size={16} aria-hidden="true" /> App Configuration
          </Link>
          <Link href="/admin/configuration/email" prefetch={false}
            aria-current={pathname === '/admin/configuration/email' ? 'page' : undefined}
            className="ms-5 flex min-h-8 items-center rounded-md px-2.5 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium">
            Email settings
          </Link>
        </div>
      )}
    </nav>
  )
}
