import 'server-only'

import { and, eq, gt, sql } from 'drizzle-orm'
import { cache } from 'react'
import type { z } from 'zod'
import { administratorSetupCodes, staffAccounts } from '@/lib/db/schema'
import { databaseUrl, getDatabase } from '@/lib/db/server'
import type { administratorSetupSchema } from '../model'
import { hashPassword } from './password.mjs'
import { hasAdministrator, hashSetupCode, lockAdministratorSetup } from './setup-store.mjs'

export const administratorSetupRequired = cache(async () => {
  return Boolean(databaseUrl() && !await hasAdministrator(getDatabase()))
})

export async function createFirstAdministrator(input: z.infer<typeof administratorSetupSchema>) {
  return getDatabase().transaction(async (transaction) => {
    await lockAdministratorSetup(transaction)
    if (await hasAdministrator(transaction)) return 'complete'

    const [code] = await transaction.select({ id: administratorSetupCodes.id })
      .from(administratorSetupCodes).where(and(
        eq(administratorSetupCodes.token_hash, hashSetupCode(input.code)),
        gt(administratorSetupCodes.expires_at, sql`now()`),
      )).limit(1)
    if (!code) return 'invalid-code'

    const [account] = await transaction.insert(staffAccounts).values({
      username: input.username, email: input.email, role: 'admin', password_hash: await hashPassword(input.password),
    }).onConflictDoNothing().returning({ id: staffAccounts.id })
    if (!account) return 'conflict'

    await transaction.delete(administratorSetupCodes).where(eq(administratorSetupCodes.id, code.id))
    return 'created'
  })
}
