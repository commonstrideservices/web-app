import { boolean, date, integer, jsonb, pgTable, pgView, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { staffRoles } from '@/features/accounts/model'
import type { contactStatuses } from '@/features/prospects/model'

// The Supabase SQL migrations own DDL, grants, triggers, and database functions.
// These mappings describe the columns the app queries.
type StaffRole = typeof staffRoles[number]
type ContactStatus = typeof contactStatuses[number]
type ReviewStatus = 'pending' | 'applied' | 'dismissed'

function timestampString(name: string) {
  return timestamp(name, { withTimezone: true, mode: 'string' })
}

export const staffAccounts = pgTable('staff_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').notNull(),
  email: text('email').notNull(),
  role: text('role').$type<StaffRole>().notNull(),
  password_hash: text('password_hash'),
  created_at: timestampString('created_at').defaultNow().notNull(),
})

export const staffSessions = pgTable('staff_sessions', {
  token_hash: text('token_hash').primaryKey(),
  staff_id: uuid('staff_id').notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
})

export const administratorSetupCodes = pgTable('administrator_setup_codes', {
  id: boolean('id').primaryKey().default(true),
  token_hash: text('token_hash').notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
})

export const prospects = pgTable('prospects', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  current_submission_id: uuid('current_submission_id'),
  contact_status: text('contact_status').$type<ContactStatus>().notNull(),
  last_contact_attempt_at: timestampString('last_contact_attempt_at'),
  follow_up_on: date('follow_up_on'),
  notes: text('notes').notNull(),
  created_at: timestampString('created_at').notNull(),
})

export const intakeSubmissions = pgTable('intake_submissions', {
  id: uuid('id').primaryKey(),
  prospect_id: uuid('prospect_id').notNull(),
  name: text('name').notNull(),
  company_name: text('company_name'),
  phone: text('phone').notNull(),
  questionnaire_version: integer('questionnaire_version').notNull(),
  answers: jsonb('answers').notNull(),
  email_verified_at: timestampString('email_verified_at'),
  review_status: text('review_status').$type<ReviewStatus>().notNull(),
  reviewed_at: timestampString('reviewed_at'),
  reviewed_by: uuid('reviewed_by'),
  created_at: timestampString('created_at').notNull(),
})

export const prospectInbox = pgView('prospect_inbox', {
  id: uuid('id').notNull(),
  email: text('email').notNull(),
  contact_status: text('contact_status').$type<ContactStatus>().notNull(),
  last_contact_attempt_at: timestampString('last_contact_attempt_at'),
  follow_up_on: date('follow_up_on'),
  created_at: timestampString('created_at').notNull(),
  name: text('name').notNull(),
  company_name: text('company_name'),
  phone: text('phone').notNull(),
  email_verified_at: timestampString('email_verified_at'),
  pending_count: integer('pending_count').notNull(),
}).existing()

export type Prospect = typeof prospects.$inferSelect
export type Submission = typeof intakeSubmissions.$inferSelect
export type ProspectInboxRow = typeof prospectInbox.$inferSelect
