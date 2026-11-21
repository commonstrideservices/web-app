import 'server-only'

import { notFound } from 'next/navigation'
import { requireStaff } from '@/features/accounts/server/session-service'

export async function requireCrmAdministrator() {
  const staff = await requireStaff()
  if (staff.role !== 'admin') notFound()
  return staff
}
