import 'server-only'

import { and, count, desc, eq, gt, isNotNull, isNull, lte, sql } from 'drizzle-orm'
import type { z } from 'zod'
import { requireStaff } from '@/features/accounts/server/session-service'
import { intakeSubmissions, prospectInbox, prospects } from '@/lib/db/schema'
import { getDatabase } from '@/lib/db/server'
import type { inboxFiltersSchema, prospectUpdateSchema, reviewSchema } from '../model'

const pageSize = 20

type DashboardMetrics = { total: number; not_contacted: number; follow_ups_due: number; pending_updates: number }

function businessDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.APP_TIME_ZONE || 'Asia/Manila',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

export async function getDashboard() {
  await requireStaff()
  const database = getDatabase()
  const [[metrics], recent] = await Promise.all([
    database.execute<DashboardMetrics>(sql`select * from public.prospect_dashboard(${businessDate()}::date)`),
    database.select().from(prospectInbox).orderBy(desc(prospectInbox.created_at), desc(prospectInbox.id)).limit(5),
  ])
  if (!metrics) throw new Error('Could not load the dashboard')
  return { metrics, recent }
}

export async function listProspects(filters: z.infer<typeof inboxFiltersSchema>) {
  await requireStaff()
  const where = and(
    filters.status ? eq(prospectInbox.contact_status, filters.status) : undefined,
    filters.verification === 'verified' ? isNotNull(prospectInbox.email_verified_at) : undefined,
    filters.verification === 'unverified' ? isNull(prospectInbox.email_verified_at) : undefined,
    filters.due ? and(eq(prospectInbox.contact_status, 'needs_follow_up'), lte(prospectInbox.follow_up_on, businessDate())) : undefined,
    filters.pending ? gt(prospectInbox.pending_count, 0) : undefined,
  )

  return getDatabase().transaction(async (transaction) => {
    const [{ total }] = await transaction.select({ total: count() }).from(prospectInbox).where(where)
    const entries = await transaction.select().from(prospectInbox).where(where)
      .orderBy(desc(prospectInbox.created_at), desc(prospectInbox.id))
      .limit(pageSize).offset((filters.page - 1) * pageSize)
    return { prospects: entries, pageCount: Math.max(1, Math.ceil(total / pageSize)), total }
  }, { isolationLevel: 'repeatable read', accessMode: 'read only' })
}

export async function getProspect(id: string) {
  await requireStaff()
  const database = getDatabase()
  const [[prospect], submissions] = await Promise.all([
    database.select().from(prospects).where(eq(prospects.id, id)).limit(1),
    database.select().from(intakeSubmissions).where(eq(intakeSubmissions.prospect_id, id))
      .orderBy(desc(intakeSubmissions.created_at), desc(intakeSubmissions.id)),
  ])
  return prospect ? { prospect, submissions } : null
}

export async function updateContactWorkflow(input: z.infer<typeof prospectUpdateSchema>) {
  const [updated] = await getDatabase().update(prospects).set({
    contact_status: input.status,
    notes: input.notes,
    follow_up_on: input.followUpOn || null,
    ...(input.recordAttempt ? { last_contact_attempt_at: new Date().toISOString() } : {}),
  }).where(eq(prospects.id, input.prospectId)).returning({ id: prospects.id })
  if (!updated) throw new Error('Could not update prospect')
}

export async function reviewSubmission(input: z.infer<typeof reviewSchema>, staffId: string) {
  const [result] = await getDatabase().execute<{ reviewed: boolean }>(sql`
    select public.review_intake_submission(
      ${input.prospectId}::uuid, ${input.submissionId}::uuid, ${input.expectedCurrentId}::uuid,
      ${staffId}::uuid, ${input.decision === 'apply'}::boolean
    ) as reviewed
  `)
  return result?.reviewed === true
}
