import 'server-only'

import { and, eq } from 'drizzle-orm'
import type { z } from 'zod'
import { staffAccounts } from '@/lib/db/schema'
import { databaseUrl, getDatabase } from '@/lib/db/server'
import type { accountSchema, loginSchema } from '../model'
import { hashPassword, verifyPassword } from './password.mjs'
import { requireStaff, startStaffSession } from './session-service'

export function staffSignInConfigured() {
  return Boolean(databaseUrl())
}

export async function signInStaff(input: z.infer<typeof loginSchema>) {
  const database = getDatabase()
  const [staff] = await database.select({ id: staffAccounts.id, hash: staffAccounts.password_hash })
    .from(staffAccounts).where(eq(staffAccounts.username, input.username)).limit(1)

  const { valid, needsUpgrade } = await verifyPassword(input.password, staff?.hash)
  if (!staff?.hash || !valid) return false

  if (needsUpgrade) {
    await database.update(staffAccounts).set({ password_hash: await hashPassword(input.password) })
      .where(and(eq(staffAccounts.id, staff.id), eq(staffAccounts.password_hash, staff.hash)))
  }

  await startStaffSession(staff.id)
  return true
}

export async function listStaffAccounts() {
  const staff = await requireStaff()
  if (staff.role !== 'admin') return []
  return getDatabase().select({
    id: staffAccounts.id, username: staffAccounts.username, email: staffAccounts.email, role: staffAccounts.role,
  }).from(staffAccounts).orderBy(staffAccounts.username)
}

export async function provisionStaffAccount(input: z.infer<typeof accountSchema>) {
  const [account] = await getDatabase().insert(staffAccounts).values({
    username: input.username, email: input.email, role: input.role,
    password_hash: await hashPassword(input.password),
  }).onConflictDoNothing().returning({ id: staffAccounts.id })
  return Boolean(account)
}
