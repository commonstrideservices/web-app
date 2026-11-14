import { randomBytes } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { hasAdministrator, hashSetupCode, lockAdministratorSetup } from '../src/features/accounts/server/setup-store.mjs'
import { connectDatabase } from '../src/lib/db/connection.mjs'

const databaseUrl = process.env.DATABASE_URL ?? ''
const url = URL.canParse(databaseUrl) ? new URL(databaseUrl) : null
if (!url || !['postgres:', 'postgresql:'].includes(url.protocol)) {
  console.error('Set DATABASE_URL before generating a setup code.')
  process.exit(1)
}

const database = connectDatabase(url)
try {
  const code = randomBytes(32).toString('base64url')
  const issued = await database.transaction(async (transaction) => {
    await lockAdministratorSetup(transaction)
    if (await hasAdministrator(transaction)) return false

    await transaction.execute(sql`
      insert into public.administrator_setup_codes (token_hash, expires_at)
      values (${hashSetupCode(code)}, now() + interval '15 minutes')
      on conflict (id) do update set token_hash = excluded.token_hash, expires_at = excluded.expires_at
    `)
    return true
  })

  if (issued) {
    console.log(`Setup code (valid for 15 minutes): ${code}`)
    console.log('Open /admin/setup and paste the code to create the first administrator.')
  } else {
    console.log('An administrator already exists. Sign in at /admin/login.')
  }
} catch {
  console.error('Could not generate a setup code. Check DATABASE_URL and apply the database migrations.')
  process.exitCode = 1
} finally {
  await database.$client.end({ timeout: 1 })
}
