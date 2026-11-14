import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { AdminTheme } from '@/features/admin/components/admin-theme'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const theme = (await cookies()).get('common-stride-admin-theme')?.value === 'dark' ? 'dark' : 'light'
  return <AdminTheme initial={theme}>{children}</AdminTheme>
}
