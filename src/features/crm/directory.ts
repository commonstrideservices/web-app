import { z } from 'zod'
import { directoryQuerySchema } from '@/features/admin/directory'
import { companyRelationships, contactAffiliations, recordIdSchema } from './model'

const freshness = z.enum(['stale', 'recent']).optional().catch(undefined)

export const companyQuerySchema = directoryQuerySchema.extend({
  sort: z.enum(['name', 'relationship', 'industry', 'contacts', 'updated']).catch('name'),
  relationship: z.enum(companyRelationships).optional().catch(undefined),
  industry: z.string().trim().min(1).max(100).optional().catch(undefined),
  country: z.string().trim().min(1).max(100).optional().catch(undefined),
  freshness,
})

export const contactQuerySchema = directoryQuerySchema.extend({
  sort: z.enum(['name', 'company', 'affiliation', 'email', 'updated']).catch('name'),
  company: recordIdSchema.optional().catch(undefined),
  affiliation: z.enum(contactAffiliations).optional().catch(undefined),
  email: z.enum(['present', 'missing']).optional().catch(undefined),
  freshness,
})

export type CompanyQuery = z.infer<typeof companyQuerySchema>
export type ContactQuery = z.infer<typeof contactQuerySchema>

export function directoryReturn(value: unknown, fallback: string) {
  if (typeof value !== 'string' || value.length > 1500 || !value.startsWith('/admin/')) return fallback
  const url = URL.parse(value, 'https://directory.local')
  if (!url || url.origin !== 'https://directory.local') return fallback
  if (url.pathname === '/admin/companies' || url.pathname === '/admin/contacts') return url.pathname + url.search
  const companyId = /^\/admin\/companies\/([^/]+)$/.exec(url.pathname)?.[1]
  return recordIdSchema.safeParse(companyId).success ? url.pathname + url.search : fallback
}
