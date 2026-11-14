import 'server-only'

import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt, lte, or, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { staffAccounts, staffSessions } from '@/lib/db/schema'
import { databaseUrl, getDatabase } from '@/lib/db/server'
import { administratorSetupRequired } from './setup-service'

const secure = process.env.NODE_ENV === 'production'
const cookieName = secure ? '__Host-common-stride-staff' : 'common-stride-staff'
const cookieOptions = { httpOnly: true, secure, sameSite: 'lax', path: '/' } as const

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function readTokenHash(token: string | undefined) {
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? tokenHash(token) : null
}

export const getStaff = cache(async () => {
  const token = readTokenHash((await cookies()).get(cookieName)?.value)
  if (!token || !databaseUrl()) return null

  const [staff] = await getDatabase().select({
    id: staffAccounts.id, username: staffAccounts.username, role: staffAccounts.role,
  }).from(staffSessions)
    .innerJoin(staffAccounts, eq(staffSessions.staff_id, staffAccounts.id))
    .where(and(eq(staffSessions.token_hash, token), gt(staffSessions.expires_at, sql`now()`)))
    .limit(1)
  return staff ?? null
})

export async function requireStaff() {
  const staff = await getStaff()
  if (!staff) redirect(await administratorSetupRequired() ? '/admin/setup' : '/admin/login')
  return staff
}

export async function startStaffSession(staffId: string) {
  const cookieStore = await cookies()
  const previousHash = readTokenHash(cookieStore.get(cookieName)?.value)
  const token = randomBytes(32).toString('base64url')

  const expires = await getDatabase().transaction(async (transaction) => {
    await transaction.delete(staffSessions).where(or(
      lte(staffSessions.expires_at, sql`now()`),
      previousHash ? eq(staffSessions.token_hash, previousHash) : undefined,
    ))
    const [session] = await transaction.insert(staffSessions).values({
      token_hash: tokenHash(token),
      staff_id: staffId,
      expires_at: sql`now() + interval '1 year'`,
    }).returning({ expiresAt: staffSessions.expires_at })
    return session.expiresAt
  })

  cookieStore.set(cookieName, token, { ...cookieOptions, expires })
}

export async function endStaffSession() {
  const cookieStore = await cookies()
  const token = readTokenHash(cookieStore.get(cookieName)?.value)
  if (token) await getDatabase().delete(staffSessions).where(eq(staffSessions.token_hash, token))
  cookieStore.set(cookieName, '', { ...cookieOptions, maxAge: 0 })
}
