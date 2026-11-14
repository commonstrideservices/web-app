'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, UserRoundCog } from 'lucide-react'

const items = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/prospects', label: 'Prospects', icon: Users },
  { href: '/admin/accounts', label: 'Staff accounts', icon: UserRoundCog, admin: true },
]

export function AdminNav({ administrator }: { administrator: boolean }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin navigation" className="flex flex-wrap gap-1 md:grid">
      {items.filter((item) => !item.admin || administrator).map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/admin' && pathname.startsWith(href + '/'))
        return <Link key={href} href={href} aria-current={active ? 'page' : undefined}
          className={`flex min-h-8 items-center gap-2 rounded-md px-2.5 text-sm transition-colors ${active ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
          <Icon size={16} aria-hidden="true" /> {label}
        </Link>
      })}
    </nav>
  )
}
