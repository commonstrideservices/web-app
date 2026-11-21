import 'server-only'

import { isDeepStrictEqual } from 'node:util'
import { and, asc, eq, ne, or, sql } from 'drizzle-orm'
import { companies, contacts } from '@/lib/db/schema'
import { getDatabase } from '@/lib/db/server'
import type { CompanyInput, CompanyMetadata, CompanyOption, ContactInput, ContactMetadata } from '../model'

type Edit = { id: string; version: string }
type SaveResult = { id: string } | { conflict: true }

function mergeFields<T extends Record<string, unknown>>(existing: T, changes: Partial<T>): T {
  const result = { ...existing }
  for (const key of Object.keys(changes) as (keyof T)[]) {
    const value = changes[key]
    if (value === undefined) delete result[key]
    else result[key] = value
  }
  return result
}

function hasChanges<T extends object>(existing: T, values: Partial<T>) {
  return (Object.keys(values) as (keyof T)[]).some((key) => !isDeepStrictEqual(existing[key], values[key]))
}

function companyValues(input: CompanyInput, existing: CompanyMetadata = {}) {
  const billing = mergeFields(existing.billing ?? {}, {
    invoiceName: input.invoiceName, contactName: input.billingContact, email: input.billingEmail,
    phone: input.billingPhone, addressLine1: input.addressLine1, addressLine2: input.addressLine2,
    city: input.billingCity, region: input.billingRegion, postalCode: input.postalCode,
    country: input.billingCountry, taxNumber: input.taxNumber,
  })
  return {
    name: input.name, website: input.website ?? null, industry: input.industry ?? null,
    country: input.country ?? null, relationship: input.relationship,
    metadata: mergeFields(existing, {
      city: input.city, region: input.region, email: input.email, phone: input.phone, notes: input.notes,
      billing: Object.keys(billing).length ? billing : undefined,
    }),
  }
}

function contactValues(input: ContactInput, existing: ContactMetadata = {}) {
  const socials = mergeFields(existing.socials ?? {}, { linkedIn: input.linkedIn })
  return {
    name: input.name, company_id: input.companyId, email: input.email ?? null, affiliation: input.affiliation,
    metadata: mergeFields(existing, {
      preferredName: input.preferredName, jobTitle: input.jobTitle, department: input.department,
      phone: input.phone, notes: input.notes, socials: Object.keys(socials).length ? socials : undefined,
    }),
  }
}

export async function saveCompany(input: CompanyInput, actorId: string, edit: Edit | null, confirmDuplicate: boolean): Promise<SaveResult | { duplicates: CompanyOption[] }> {
  return getDatabase().transaction(async (db) => {
    const [existing] = edit ? await db.select().from(companies).where(eq(companies.id, edit.id)).for('update') : []
    if (edit && existing?.updated_at !== edit.version) return { conflict: true }

    const values = companyValues(input, existing?.metadata)
    if (!confirmDuplicate && (!existing || existing.name !== values.name || existing.website !== values.website)) {
      const hostname = input.website ? new URL(input.website).hostname.replace(/^www\./i, '') : undefined
      const duplicates = await db.select({
        id: companies.id, name: companies.name, website: companies.website, country: companies.country,
      }).from(companies).where(and(
        edit ? ne(companies.id, edit.id) : undefined,
        or(
          sql`lower(${companies.name}) = lower(${input.name})`,
          hostname ? sql`lower(substring(${companies.website} from '^https?://(?:www[.])?([^/:?#]+)')) = ${hostname}` : undefined,
        ),
      )).orderBy(asc(companies.name), asc(companies.id)).limit(5)
      if (duplicates.length) return { duplicates }
    }

    if (!existing) {
      const [record] = await db.insert(companies).values({ ...values, created_by: actorId, updated_by: actorId })
        .returning({ id: companies.id })
      return record
    }

    const { id } = existing
    if (hasChanges(existing, values)) {
      await db.update(companies).set({ ...values, updated_at: sql`clock_timestamp()`, updated_by: actorId })
        .where(eq(companies.id, id))
    }
    return { id }
  })
}

export async function saveContact(input: ContactInput, actorId: string, edit: Edit | null): Promise<SaveResult> {
  return getDatabase().transaction(async (db) => {
    const [existing] = edit ? await db.select().from(contacts).where(eq(contacts.id, edit.id)).for('update') : []
    if (edit && existing?.updated_at !== edit.version) return { conflict: true }

    const values = contactValues(input, existing?.metadata)
    if (!existing) {
      const [record] = await db.insert(contacts).values({ ...values, created_by: actorId, updated_by: actorId })
        .returning({ id: contacts.id })
      return record
    }

    const { id } = existing
    if (hasChanges(existing, values)) {
      await db.update(contacts).set({ ...values, updated_at: sql`clock_timestamp()`, updated_by: actorId })
        .where(eq(contacts.id, id))
    }
    return { id }
  })
}
