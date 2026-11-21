import 'server-only'

import { notFound } from 'next/navigation'
import { getStaff, requireStaff } from '@/features/accounts/server/session-service'

export async function requireEmailAdministrator() {
  const staff = await requireStaff()
  if (staff.role !== 'admin') notFound()
  return staff
}

export async function getEmailAdministrator() {
  const staff = await getStaff()
  return staff?.role === 'admin' ? staff : null
}

export class EmailError extends Error {}

export function emailErrorMessage(error: unknown, fallback: string) {
  return error instanceof EmailError ? error.message : fallback
}
