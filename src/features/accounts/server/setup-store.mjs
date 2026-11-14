import { createHash } from 'node:crypto'
import { sql } from 'drizzle-orm'

/** @typedef {Pick<ReturnType<typeof import('../../../lib/db/connection.mjs').connectDatabase>, 'execute'>} DatabaseExecutor */

/** @param {DatabaseExecutor} database */
export async function hasAdministrator(database) {
  const [state] = await database.execute(sql`
    select exists (
      select 1 from public.staff_accounts where role = 'admin' and password_hash is not null
    ) as admin_exists
  `)
  return state.admin_exists === true
}

/** @param {DatabaseExecutor} transaction */
export async function lockAdministratorSetup(transaction) {
  await transaction.execute(sql`select pg_advisory_xact_lock(hashtext('common-stride/bootstrap-admin'))`)
}

/** @param {string} code */
export function hashSetupCode(code) {
  return createHash('sha256').update(code).digest('hex')
}
