import Link from 'next/link'
import { DataTable, DirectoryFilter } from '@/features/admin/components/data-table'
import { directoryUrl } from '@/features/admin/directory'
import { normalizeCountry, normalizeIndustry } from '../company-fields'
import { type CompanyQuery, type ContactQuery } from '../directory'
import {
  companyRelationshipLabels, companyRelationships, contactAffiliationLabels, contactAffiliations,
} from '../model'
import type { CompanyRow, ContactRow, listCompanies, listContacts } from '../server/directory-service'
import { CompanyPicker } from './company-picker'
import { UpdatedDate } from './updated-date'

const freshnessOptions = [{ value: 'stale', label: 'Stale' }, { value: 'recent', label: 'Up to date' }]
const linkClass = 'font-medium underline-offset-4 hover:underline focus-visible:underline break-words'

export function CompanyTable({ query, result }: { query: CompanyQuery; result: Awaited<ReturnType<typeof listCompanies>> }) {
  const pathname = '/admin/companies'
  const industry = query.industry ? normalizeIndustry(query.industry) : undefined
  const country = query.country ? normalizeCountry(query.country) : undefined
  const state = { ...query, industry, country, page: result.page }
  const from = directoryUrl(pathname, state)
  const columns = [
    { id: 'name', label: 'Company', sort: 'name', cell: (row: CompanyRow) => <div className="grid min-w-32 gap-1">
      <Link className={linkClass} href={directoryUrl(`/admin/companies/${row.id}`, { from })}>{row.name}</Link>
      {row.country && <span className="text-xs text-muted-foreground">{normalizeCountry(row.country)}</span>}
    </div> },
    { id: 'relationship', label: 'Relationship', sort: 'relationship', cell: (row: CompanyRow) => companyRelationshipLabels[row.relationship] },
    { id: 'industry', label: 'Industry', sort: 'industry', cell: (row: CompanyRow) => row.industry ? normalizeIndustry(row.industry) : '—' },
    { id: 'contacts', label: 'Contacts', sort: 'contacts', cell: (row: CompanyRow) => row.contactCount },
    { id: 'updated', label: 'Last updated', sort: 'updated', cell: (row: CompanyRow) => <UpdatedDate timestamp={row.updatedAt} stale={row.stale} /> },
  ]

  return <DataTable pathname={pathname} label="Companies" query={state} searchPlaceholder="Name or website"
    rows={result.rows} total={result.total} columns={columns}
    emptyMessage={result.metrics.total ? 'No companies match your search and filters.' : 'No companies yet.'}
    filters={<>
      <DirectoryFilter name="relationship" label="Relationship" value={query.relationship}
        options={companyRelationships.map((value) => ({ value, label: companyRelationshipLabels[value] }))} />
      <DirectoryFilter name="industry" label="Industry" value={industry}
        options={result.industries.map((value) => ({ value, label: value }))} />
      <DirectoryFilter name="country" label="Country" value={country}
        options={result.countries.map((value) => ({ value, label: value }))} />
      <DirectoryFilter name="freshness" label="Freshness" value={query.freshness} options={freshnessOptions} />
    </>} />
}

export function ContactTable({ pathname, query, result, companyOnly = false, returnTo }: {
  pathname: string; query: ContactQuery; result: Awaited<ReturnType<typeof listContacts>>; companyOnly?: boolean; returnTo?: string
}) {
  const state = { ...query, page: result.page }
  const from = directoryUrl(pathname, { ...state, from: returnTo })
  const columns = [
    { id: 'name', label: 'Contact', sort: 'name', cell: (row: ContactRow) => <div className="grid min-w-32 gap-1">
      <Link className={linkClass} href={directoryUrl(`/admin/contacts/${row.id}`, { from })}>{row.name}</Link>
      {row.jobTitle && <span className="text-xs text-muted-foreground">{row.jobTitle}</span>}
    </div> },
    { id: 'company', label: 'Company', sort: 'company', cell: (row: ContactRow) => (
      <Link className={linkClass} href={directoryUrl(`/admin/companies/${row.companyId}`, { from })}>{row.companyName}</Link>
    ) },
    { id: 'affiliation', label: 'Affiliation', sort: 'affiliation', cell: (row: ContactRow) => contactAffiliationLabels[row.affiliation] },
    { id: 'email', label: 'Work email', sort: 'email', cell: (row: ContactRow) => row.email ?? '—' },
    { id: 'updated', label: 'Last updated', sort: 'updated', cell: (row: ContactRow) => <UpdatedDate timestamp={row.updatedAt} stale={row.stale} /> },
  ].filter(({ id }) => id !== 'company' || !companyOnly)

  return <DataTable pathname={pathname} label="Contacts" query={state}
    fixedQuery={returnTo ? { from: returnTo } : undefined}
    searchPlaceholder={companyOnly ? 'Name or email' : 'Name, email, or company'}
    rows={result.rows} total={result.total} columns={columns}
    emptyMessage={result.metrics.total ? 'No contacts match your search and filters.' : 'No contacts yet.'}
    filters={<>
      {!companyOnly && <div className="col-span-2 grid min-w-0 gap-1.5 text-sm font-medium sm:w-52">
        <label htmlFor="directory-company">Company</label>
        <CompanyPicker id="directory-company" name="company" placeholder="All companies" initial={result.selectedCompany} />
      </div>}
      <DirectoryFilter name="affiliation" label="Affiliation" value={query.affiliation}
        options={contactAffiliations.map((value) => ({ value, label: contactAffiliationLabels[value] }))} />
      <DirectoryFilter name="email" label="Work email" value={query.email}
        options={[{ value: 'present', label: 'Has email' }, { value: 'missing', label: 'No email' }]} />
      <DirectoryFilter name="freshness" label="Freshness" value={query.freshness} options={freshnessOptions} />
    </>} />
}
