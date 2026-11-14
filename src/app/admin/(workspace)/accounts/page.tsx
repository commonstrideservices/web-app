import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateStaffForm } from '@/features/accounts/components/account-forms'
import { staffRoleLabels } from '@/features/accounts/model'
import { listStaffAccounts } from '@/features/accounts/server/account-service'
import { requireStaff } from '@/features/accounts/server/session-service'

export const metadata: Metadata = { title: 'Staff accounts' }

export default async function AccountsPage() {
  const staff = await requireStaff()
  if (staff.role !== 'admin') notFound()
  const accounts = await listStaffAccounts()
  return (
    <div className="grid gap-6">
      <h1 className="font-heading text-4xl font-bold tracking-tight">Staff accounts</h1>
      <Card>
        <CardHeader><CardTitle>Create a staff account</CardTitle></CardHeader>
        <CardContent><CreateStaffForm /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Accounts</CardTitle></CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {accounts.map((account) => <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={account.id}>
              <div><p className="font-medium">{account.username}</p><p className="break-all text-sm text-muted-foreground">{account.email}</p></div>
              <Badge variant="secondary">{staffRoleLabels[account.role]}</Badge>
            </li>)}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
