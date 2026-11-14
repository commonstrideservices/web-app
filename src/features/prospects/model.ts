import { z } from 'zod'

export const contactStatuses = ['not_contacted', 'contacted', 'needs_follow_up'] as const
export const contactStatusLabels = {
  not_contacted: 'Not contacted',
  contacted: 'Contacted',
  needs_follow_up: 'Needs follow-up',
} as const

export const inboxFiltersSchema = z.object({
  status: z.enum(contactStatuses).optional().catch(undefined),
  verification: z.enum(['verified', 'unverified']).optional().catch(undefined),
  due: z.literal('1').optional().catch(undefined),
  pending: z.literal('1').optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
})

export const prospectUpdateSchema = z.object({
  prospectId: z.uuid(),
  status: z.enum(contactStatuses),
  followUpOn: z.union([z.iso.date(), z.literal('')]),
  notes: z.string().trim().max(4000),
  recordAttempt: z.boolean(),
})

export const reviewSchema = z.object({
  prospectId: z.uuid(), submissionId: z.uuid(), expectedCurrentId: z.uuid(),
  decision: z.enum(['apply', 'dismiss']),
})
