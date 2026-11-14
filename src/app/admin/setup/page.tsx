import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AdministratorSetupForm } from '@/features/accounts/components/account-forms'
import { StaffAccessCard } from '@/features/accounts/components/staff-access-card'
import { administratorSetupRequired } from '@/features/accounts/server/setup-service'

export const metadata: Metadata = { title: 'Admin setup' }

export default async function AdministratorSetupPage() {
  if (!await administratorSetupRequired()) redirect('/admin/login')

  return (
    <StaffAccessCard title="Set up your admin" description="Create the first administrator for Common Stride.">
      <div className="mb-5 grid gap-2 rounded-md border border-border bg-secondary p-3 text-sm">
        <p>Run this command in the project terminal, then paste the setup code below. The code expires in 15 minutes.</p>
        <code className="font-mono font-semibold">npm run admin:setup</code>
      </div>
      <AdministratorSetupForm />
    </StaffAccessCard>
  )
}
