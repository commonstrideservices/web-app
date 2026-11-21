import 'server-only'

import { and, asc, count, desc, eq, exists, inArray, isNotNull, isNull, not, or, sql, type SQL, type SQLWrapper } from 'drizzle-orm'
import { requireStaff } from '@/features/accounts/server/session-service'
import { companies, contacts } from '@/lib/db/schema'
import { getDatabase } from '@/lib/db/server'
import { normalizeCountry, normalizeIndustry } from '../company-fields'
import type { CompanyQuery, ContactQuery } from '../directory'

function contains(column: SQLWrapper, value: string) {
  const escaped = value.replaceAll('!', '!!').replaceAll('%', '!%').replaceAll('_', '!_')
  return sql`${column} ilike ${`%${escaped}%`} escape '!'`
}

function lower(column: SQLWrapper) {
  return sql`lower(${column})`
}

function staleAt(updatedAt: SQLWrapper, now: string) {
  const timeZone = process.env.APP_TIME_ZONE || 'Asia/Manila'
  const sixMonthsLater = sql`timezone(${timeZone}::text, timezone(${timeZone}::text, ${updatedAt}) + interval '6 months')`
  return sql<boolean>`${now}::timestamptz > ${sixMonthsLater}`
}

function freshnessFilter(stale: SQL<boolean>, filter: CompanyQuery['freshness']) {
  return filter === 'stale' ? stale : filter === 'recent' ? not(stale) : undefined
}

function filteredCount(condition: SQL) {
  return sql<number>`count(*) filter (where ${condition})`.mapWith(Number)
}

function order(column: SQLWrapper, direction: CompanyQuery['direction']) {
  return sql`${direction === 'desc' ? desc(column) : asc(column)} nulls last`
}

const companyOption = { id: companies.id, name: companies.name, website: companies.website, country: companies.country }

function groupFacetValues(rows: { value: string | null }[], normalize: (value: string) => string) {
  const groups = new Map<string, string[]>()
  for (const { value } of rows) {
    if (!value) continue
    const label = normalize(value)
    if (!label) continue
    const group = groups.get(label)
    if (group) group.push(value)
    else groups.set(label, [value])
  }
  return groups
}

async function companyFacets() {
  const db = getDatabase()
  const [industries, countries] = await Promise.all([
    db.selectDistinct({ value: companies.industry }).from(companies).where(isNotNull(companies.industry)),
    db.selectDistinct({ value: companies.country }).from(companies).where(isNotNull(companies.country)),
  ])
  return {
    industries: groupFacetValues(industries, normalizeIndustry),
    countries: groupFacetValues(countries, normalizeCountry),
  }
}

function facetLabels(facet: Map<string, string[]>) {
  return [...facet.keys()].sort((left, right) => left.localeCompare(right, 'en'))
}

function facetMatches(facet: Map<string, string[]>, label: string) {
  return [...new Set([label, ...(facet.get(label) ?? [])])]
}

export async function companyFieldOptions() {
  await requireStaff()
  const { industries, countries } = await companyFacets()
  return { industries: facetLabels(industries), countries: facetLabels(countries) }
}

export async function listCompanies(query: CompanyQuery) {
  await requireStaff()
  const db = getDatabase()
  const stale = staleAt(companies.updated_at, new Date().toISOString())
  const companyContacts = db.select({ id: contacts.id }).from(contacts).where(eq(contacts.company_id, companies.id))
  const contactCount = sql<number>`(${db.select({ count: count() }).from(contacts)
    .where(eq(contacts.company_id, companies.id))})`.mapWith(Number)
  const { industries, countries } = await companyFacets()
  const industry = query.industry ? normalizeIndustry(query.industry) : undefined
  const country = query.country ? normalizeCountry(query.country) : undefined
  const criteria = and(
    query.q ? or(contains(companies.name, query.q), contains(companies.website, query.q)) : undefined,
    query.relationship ? eq(companies.relationship, query.relationship) : undefined,
    industry ? inArray(companies.industry, facetMatches(industries, industry)) : undefined,
    country ? inArray(companies.country, facetMatches(countries, country)) : undefined,
    freshnessFilter(stale, query.freshness),
  )
  const columns = {
    name: lower(companies.name), relationship: companies.relationship, industry: lower(companies.industry),
    contacts: contactCount, updated: companies.updated_at,
  }
  const [[metrics], [{ total }]] = await Promise.all([
    db.select({ total: count(), stale: filteredCount(stale), withoutContacts: filteredCount(not(exists(companyContacts))) })
      .from(companies),
    db.select({ total: count() }).from(companies).where(criteria),
  ])
  const page = Math.min(query.page, Math.max(1, Math.ceil(total / query.size)))
  const rows = await db.select({
    ...companyOption, industry: companies.industry, relationship: companies.relationship,
    updatedAt: companies.updated_at, contactCount, stale,
  }).from(companies).where(criteria).orderBy(order(columns[query.sort], query.direction), asc(companies.id))
    .limit(query.size).offset((page - 1) * query.size)
  return { rows, total, page, metrics, industries: facetLabels(industries), countries: facetLabels(countries) }
}

export async function listContacts(query: ContactQuery, companyId?: string) {
  await requireStaff()
  const db = getDatabase()
  const stale = staleAt(contacts.updated_at, new Date().toISOString())
  const company = companyId ?? query.company
  const criteria = and(
    company ? eq(contacts.company_id, company) : undefined,
    query.q ? or(
      contains(contacts.name, query.q), contains(contacts.email, query.q),
      companyId ? undefined : contains(companies.name, query.q),
    ) : undefined,
    query.affiliation ? eq(contacts.affiliation, query.affiliation) : undefined,
    query.email === 'present' ? isNotNull(contacts.email) : query.email === 'missing' ? isNull(contacts.email) : undefined,
    freshnessFilter(stale, query.freshness),
  )
  const columns = {
    name: lower(contacts.name), company: lower(companies.name), affiliation: contacts.affiliation,
    email: contacts.email, updated: contacts.updated_at,
  }
  const [[metrics], [{ total }], selectedCompany] = await Promise.all([
    db.select({ total: count(), stale: filteredCount(stale), withoutEmail: filteredCount(isNull(contacts.email)) })
      .from(contacts).where(companyId ? eq(contacts.company_id, companyId) : undefined),
    db.select({ total: count() }).from(contacts)
      .innerJoin(companies, eq(companies.id, contacts.company_id)).where(criteria),
    query.company && !companyId ? getCompanyOption(query.company) : undefined,
  ])
  const page = Math.min(query.page, Math.max(1, Math.ceil(total / query.size)))
  const rows = await db.select({
    id: contacts.id, name: contacts.name, email: contacts.email, affiliation: contacts.affiliation,
    companyId: companies.id, companyName: companies.name, updatedAt: contacts.updated_at,
    jobTitle: sql<string | null>`${contacts.metadata}->>'jobTitle'`, stale,
  }).from(contacts).innerJoin(companies, eq(companies.id, contacts.company_id)).where(criteria)
    .orderBy(order(columns[query.sort], query.direction), asc(contacts.id))
    .limit(query.size).offset((page - 1) * query.size)
  return { rows, total, page, metrics, selectedCompany }
}

export async function getCompany(id: string) {
  await requireStaff()
  const [record] = await getDatabase().select({
    record: companies, stale: staleAt(companies.updated_at, new Date().toISOString()),
  }).from(companies).where(eq(companies.id, id))
  return record
}

export async function getContact(id: string) {
  await requireStaff()
  const [record] = await getDatabase().select({
    record: contacts, company: companyOption, stale: staleAt(contacts.updated_at, new Date().toISOString()),
  }).from(contacts).innerJoin(companies, eq(companies.id, contacts.company_id)).where(eq(contacts.id, id))
  return record
}

export async function getCompanyOption(id: string) {
  await requireStaff()
  const [company] = await getDatabase().select(companyOption).from(companies).where(eq(companies.id, id))
  return company
}

export async function findCompanyOptions(query: string) {
  await requireStaff()
  return getDatabase().select(companyOption).from(companies)
    .where(query ? or(contains(companies.name, query), contains(companies.website, query)) : undefined)
    .orderBy(asc(lower(companies.name)), asc(companies.id)).limit(20)
}

export type CompanyRow = Awaited<ReturnType<typeof listCompanies>>['rows'][number]
export type ContactRow = Awaited<ReturnType<typeof listContacts>>['rows'][number]
