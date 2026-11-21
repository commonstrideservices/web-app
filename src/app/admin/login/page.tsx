import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/features/accounts/components/account-forms'
import { StaffAccessCard } from '@/features/accounts/components/staff-access-card'
import { staffSignInConfigured } from '@/features/accounts/server/account-service'
import { getStaff } from '@/features/accounts/server/session-service'
import { administratorSetupRequired } from '@/features/accounts/server/setup-service'
import { AdminFeedback } from '@/features/admin/components/admin-status'

export const metadata: Metadata = { title: 'Staff sign-in' }

export default async function LoginPage() {
  if (await administratorSetupRequired()) redirect('/admin/setup')
  if (await getStaff()) redirect('/admin')
  const configured = staffSignInConfigured()
  return (
    <StaffAccessCard title="Staff sign-in" description="Sign in to manage Common Stride prospects.">
      {!configured && <AdminFeedback tone="warning" className="mb-5">Staff sign-in is temporarily unavailable.</AdminFeedback>}
      <LoginForm configured={configured} />
    </StaffAccessCard>
  )
}
