import { boolean, date, integer, jsonb, pgSchema, pgTable, pgView, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { staffRoles } from '@/features/accounts/model'
import type { CompanyMetadata, CompanyRelationship, ContactAffiliation, ContactMetadata } from '@/features/crm/model'
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

const appPrivate = pgSchema('app_private')

export const companies = appPrivate.table('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  website: text('website'),
  industry: text('industry'),
  country: text('country'),
  relationship: text('relationship').$type<CompanyRelationship>().notNull().default('unclassified'),
  metadata: jsonb('metadata').$type<CompanyMetadata>().notNull().default({}),
  created_at: timestampString('created_at').notNull().defaultNow(),
  updated_at: timestampString('updated_at').notNull().defaultNow(),
  created_by: uuid('created_by'),
  updated_by: uuid('updated_by'),
})

export const contacts = appPrivate.table('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  company_id: uuid('company_id').notNull(),
  name: text('name').notNull(),
  email: text('email'),
  affiliation: text('affiliation').$type<ContactAffiliation>().notNull().default('unknown'),
  metadata: jsonb('metadata').$type<ContactMetadata>().notNull().default({}),
  created_at: timestampString('created_at').notNull().defaultNow(),
  updated_at: timestampString('updated_at').notNull().defaultNow(),
  created_by: uuid('created_by'),
  updated_by: uuid('updated_by'),
})

export const appSettings = appPrivate.table('app_settings', {
  key: text('key').primaryKey(),
  schema_version: integer('schema_version').notNull(),
  value: jsonb('value').notNull(),
  updated_at: timestampString('updated_at').notNull().defaultNow(),
})

export const emailMailboxes = appPrivate.table('email_mailboxes', {
  id: uuid('id').defaultRandom().primaryKey(),
  display_name: text('display_name').notNull(),
  address: text('address').notNull(),
  username: text('username').notNull(),
  provider: text('provider').notNull(),
  imap_host: text('imap_host').notNull(),
  imap_port: integer('imap_port').notNull(),
  imap_security: text('imap_security').notNull(),
  smtp_host: text('smtp_host').notNull(),
  smtp_port: integer('smtp_port').notNull(),
  smtp_security: text('smtp_security').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  is_default: boolean('is_default').notNull().default(false),
  updated_at: timestampString('updated_at').notNull().defaultNow(),
})

export const emailMailboxCredentials = appPrivate.table('email_mailbox_credentials', {
  mailbox_id: uuid('mailbox_id').primaryKey(),
  encrypted_password: text('encrypted_password').notNull(),
  key_version: integer('key_version').notNull(),
})

export const emailTemplateFragments = appPrivate.table('email_template_fragments', {
  id: uuid('id').defaultRandom().primaryKey(),
  kind: text('kind').$type<'header' | 'footer'>().notNull(),
  name: text('name').notNull(),
  html: text('html').notNull(),
  updated_at: timestampString('updated_at').notNull().defaultNow(),
})

export const emailTemplates = appPrivate.table('email_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  subject: text('subject').notNull().default(''),
  body: text('body').notNull(),
  html: text('html'),
  header_id: uuid('header_id'),
  footer_id: uuid('footer_id'),
  updated_at: timestampString('updated_at').notNull().defaultNow(),
})

export const emailSendAttempts = appPrivate.table('email_send_attempts', {
  id: uuid('id').primaryKey(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
