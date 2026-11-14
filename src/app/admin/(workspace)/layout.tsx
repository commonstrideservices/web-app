import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requireStaff } from '@/features/accounts/server/session-service'
import { UserServerAction } from '@/features/accounts/user-server-action'
import { AdminNav } from '@/features/admin/components/admin-nav'
import { AdminThemeToggle } from '@/features/admin/components/admin-theme'
import { Brand } from '@/features/site/components/brand'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff()

  return (
    <div className="min-h-dvh bg-sidebar md:grid md:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="flex flex-col gap-3 border-b border-sidebar-border px-3 py-3 text-sidebar-foreground md:sticky md:top-0 md:h-dvh md:border-b-0 md:py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <Brand href="/admin" compact />
          <div className="md:hidden"><AdminThemeToggle /></div>
        </div>
        <AdminNav administrator={staff.role === 'admin'} />
      </aside>
      <div className="min-w-0 bg-background md:m-2 md:ms-0 md:rounded-xl md:border md:border-border md:shadow-xs">
        <header className="flex min-h-12 items-center justify-end gap-2 border-b border-border px-4 lg:px-6">
          <div className="hidden md:block"><AdminThemeToggle /></div>
          <span className="max-w-36 truncate text-sm text-muted-foreground">{staff.username}</span>
          <form action={UserServerAction.signOut}>
            <Button variant="ghost" size="sm" type="submit"><LogOut aria-hidden="true" /> Sign out</Button>
          </form>
        </header>
        <main className="mx-auto max-w-[85rem] px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  )
}
