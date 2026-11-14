import 'server-only'

import { createHmac } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { databaseUrl, getDatabase } from '@/lib/db/server'

function rateLimitKey() {
  if (process.env.RATE_LIMIT_SECRET) return process.env.RATE_LIMIT_SECRET
  const password = databaseUrl()?.password
  if (!password) throw new Error('The rate limit key is not configured')
  return createHmac('sha256', decodeURIComponent(password)).update('common-stride:rate-limit:v1').digest()
}

export async function allowRequest(
  scope: 'intake' | 'login',
  identity: string,
  limits: { perIdentity: number; perNetwork: number },
) {
  const key = rateLimitKey()
  const requestHeaders = await headers()
  const forwarded = process.env.VERCEL
    ? requestHeaders.get('x-vercel-forwarded-for')
    : process.env.TRUST_PROXY_FORWARDED_FOR === '1' ? requestHeaders.get('x-forwarded-for') : null
  const network = forwarded?.split(',').at(-1)?.trim() || 'unknown'
  const database = getDatabase()

  async function consume(kind: string, value: string, limit: number) {
    const digest = createHmac('sha256', key).update(value).digest('hex')
    const bucket = [scope, kind, digest].join(':')
    const [result] = await database.execute<{ allowed: boolean }>(sql`
      select public.consume_rate_limit(${bucket}::text, ${15 * 60}::integer, ${limit}::integer) as allowed
    `)
    return result?.allowed === true
  }

  return await consume('network', network, limits.perNetwork)
    && await consume('identity', identity, limits.perIdentity)
}
