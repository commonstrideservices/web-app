import 'server-only'

import { connectDatabase } from './connection.mjs'

export function databaseUrl() {
  const value = process.env.DATABASE_URL
  if (!value || !URL.canParse(value)) return null
  const url = new URL(value)
  return url.protocol === 'postgresql:' || url.protocol === 'postgres:' ? url : null
}

type Database = ReturnType<typeof connectDatabase>
const development = globalThis as typeof globalThis & { commonStrideDatabase?: Database }
let database: Database | undefined

export function getDatabase() {
  if (database) return database
  const url = databaseUrl()
  if (!url) throw new Error('The database is not configured')
  database = process.env.NODE_ENV === 'development'
    ? development.commonStrideDatabase ??= connectDatabase(url)
    : connectDatabase(url)
  return database
}
