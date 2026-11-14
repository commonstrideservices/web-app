import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/features/accounts/components/account-forms'
import { StaffAccessCard } from '@/features/accounts/components/staff-access-card'
import { staffSignInConfigured } from '@/features/accounts/server/account-service'
import { getStaff } from '@/features/accounts/server/session-service'
import { administratorSetupRequired } from '@/features/accounts/server/setup-service'

export const metadata: Metadata = { title: 'Staff sign-in' }

export default async function LoginPage() {
  if (await administratorSetupRequired()) redirect('/admin/setup')
  if (await getStaff()) redirect('/admin')
  const configured = staffSignInConfigured()
  return (
    <StaffAccessCard title="Staff sign-in" description="Sign in to manage Common Stride prospects.">
      {!configured && <p className="mb-5 rounded-md border border-border bg-secondary p-3 text-sm" role="status">Staff sign-in is temporarily unavailable.</p>}
      <LoginForm configured={configured} />
    </StaffAccessCard>
  )
}
