import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AdministratorSetupForm } from '@/features/accounts/components/account-forms'
import { StaffAccessCard } from '@/features/accounts/components/staff-access-card'
import { administratorSetupRequired } from '@/features/accounts/server/setup-service'
import { AdminFeedback } from '@/features/admin/components/admin-status'

export const metadata: Metadata = { title: 'Admin setup' }

export default async function AdministratorSetupPage() {
  if (!await administratorSetupRequired()) redirect('/admin/login')

  return (
    <StaffAccessCard title="Set up your admin" description="Create the first administrator for Common Stride.">
      <AdminFeedback tone="info" className="mb-5">
        <p>Run this command in the project terminal, then paste the setup code below. The code expires in 15 minutes.</p>
        <code className="mt-2 block font-mono font-semibold">npm run admin:setup</code>
      </AdminFeedback>
      <AdministratorSetupForm />
    </StaffAccessCard>
  )
}
