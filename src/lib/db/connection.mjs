import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

/** @param {URL} url */
export function connectDatabase(url) {
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  const verifyCertificate = url.searchParams.get('sslmode') === 'verify-full' || url.searchParams.has('sslrootcert')
  return drizzle(postgres(url.href, {
    max: 1,
    max_pipeline: 1,
    prepare: false,
    connect_timeout: 10,
    ssl: verifyCertificate ? 'verify-full' : local ? false : 'require',
  }))
}
