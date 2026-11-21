import { z } from 'zod'
import { composeLimits, type ComposeReply } from '../model'

const cachedCompose = z.object({
  fields: z.object({
    to: z.string().max(composeLimits.recipients),
    cc: z.string().max(composeLimits.recipients),
    bcc: z.string().max(composeLimits.recipients),
    subject: z.string().max(composeLimits.subject),
    body: z.string().max(composeLimits.body),
    templateId: z.union([z.uuid(), z.literal('')]),
  }),
  saveId: z.uuid().nullable(),
})

type CachedCompose = z.infer<typeof cachedCompose>
export type ComposeFields = CachedCompose['fields']

export function composeCacheKey(staffId: string, draftId: string) {
  return `common-stride:email-compose:v1:${staffId}:${draftId}`
}

export function readCachedCompose(key: string, reply?: ComposeReply): CachedCompose {
  try {
    const cached = cachedCompose.safeParse(JSON.parse(localStorage.getItem(key) ?? 'null'))
    if (cached.success) return cached.data
  } catch {
    // Compose remains usable if storage is blocked or the entry is corrupt.
  }
  return {
    fields: { to: reply?.to ?? '', cc: '', bcc: '', subject: reply?.subject ?? '', body: '', templateId: '' },
    saveId: null,
  }
}

export function writeCachedCompose(key: string, draft: CachedCompose | null) {
  try {
    if (draft) localStorage.setItem(key, JSON.stringify(draft))
    else localStorage.removeItem(key)
  } catch {
    // The open editor still holds the draft when the browser cannot cache it.
  }
}
