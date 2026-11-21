import { z } from 'zod'

export type SearchParams = Record<string, string | string[] | undefined>

export const pageSizes = [10, 25, 50] as const
export const defaultPageSize = 25

export const directoryQuerySchema = z.object({
  q: z.string().trim().max(150).catch(''),
  direction: z.enum(['asc', 'desc']).catch('asc'),
  page: z.coerce.number().int().min(1).max(1_000_000).catch(1),
  size: z.enum(['10', '25', '50']).transform(Number).catch(defaultPageSize),
})

export type DirectoryQuery = z.infer<typeof directoryQuerySchema> & { sort: string }
type QueryValues = Record<string, string | number | undefined>

export function directoryUrl(pathname: string, query: QueryValues, changes: QueryValues = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...query, ...changes })) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const search = params.toString()
  return search ? `${pathname}?${search}` : pathname
}
