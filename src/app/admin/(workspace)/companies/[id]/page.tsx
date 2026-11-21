import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requireStaff } from '@/features/accounts/server/session-service'
import { directoryUrl, type SearchParams } from '@/features/admin/directory'
import { normalizeCountry, normalizeIndustry, subdivisionLabel } from '@/features/crm/company-fields'
import { ContactTable } from '@/features/crm/components/directory-tables'
import { mailLink, RecordDetails, RecordHeader, recordLinkClass, webLink } from '@/features/crm/components/record-details'
import { UpdatedDate } from '@/features/crm/components/updated-date'
import { contactQuerySchema, directoryReturn } from '@/features/crm/directory'
import { companyMetadataSchema, companyRelationshipLabels, recordIdSchema } from '@/features/crm/model'
import { getCompany, listContacts } from '@/features/crm/server/directory-service'

export const metadata: Metadata = { title: 'Company details' }

export default async function CompanyPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<SearchParams>
}) {
  const [route, search, staff] = await Promise.all([params, searchParams, requireStaff()])
  const id = recordIdSchema.safeParse(route.id)
  if (!id.success) notFound()
  const pathname = `/admin/companies/${id.data}`
  const query = contactQuerySchema.parse({ ...search, company: undefined })
  const [company, result] = await Promise.all([getCompany(id.data), listContacts(query, id.data)])
  if (!company) notFound()

  const from = directoryReturn(search.from, '/admin/companies')
  const relatedPath = directoryUrl(pathname, { ...query, page: result.page, from })
  const { record, stale } = company
  const details = companyMetadataSchema.parse(record.metadata)
  const billing = details.billing

  return <div className="grid min-w-0 gap-5">
    <RecordHeader title={record.name} from={from} backLabel={from.startsWith('/admin/contacts') ? 'Back to contacts' : 'Back to companies'}
      saved={search.saved === '1'}
      action={staff.role === 'admin' && <Button asChild variant="outline">
        <Link href={directoryUrl(pathname + '/edit', { from })}><Pencil aria-hidden="true" /> Edit company</Link>
      </Button>}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
          <span>Last updated</span><UpdatedDate timestamp={record.updated_at} stale={stale} detailed />
        </div>
        <a href="#company-contacts" className={`inline-flex min-h-8 items-center ${recordLinkClass}`}>
          View contacts ({result.metrics.total})
        </a>
      </div>
    </RecordHeader>
    <RecordDetails title="Company information" fields={[
      ['Relationship', companyRelationshipLabels[record.relationship]],
      ['Industry', record.industry && normalizeIndustry(record.industry)],
      ['Website', webLink(record.website)], ['Country', record.country && normalizeCountry(record.country)], ['City', details.city],
      [subdivisionLabel, details.region], ['General email', mailLink(details.email)], ['Main phone', details.phone],
      ['Internal notes', details.notes],
    ]} />
    <section id="company-contacts" aria-labelledby="company-contacts-title" className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="company-contacts-title" className="font-heading text-xl font-semibold">Contacts ({result.metrics.total})</h2>
        {staff.role === 'admin' && <Button asChild>
          <Link href={directoryUrl('/admin/contacts/new', { company: record.id, from: relatedPath })}>
            <Plus aria-hidden="true" /> Add contact
          </Link>
        </Button>}
      </div>
      <ContactTable pathname={pathname} query={query} result={result} companyOnly returnTo={from} />
    </section>
    <RecordDetails title="Billing information" emptyMessage="No billing details provided." fields={[
      ['Legal or invoice name', billing?.invoiceName], ['Tax or registration number', billing?.taxNumber],
      ['Billing contact', billing?.contactName], ['Billing email', mailLink(billing?.email)], ['Billing phone', billing?.phone],
      ['Address', [billing?.addressLine1, billing?.addressLine2, billing?.city, billing?.region, billing?.postalCode,
        billing?.country && normalizeCountry(billing.country)]
        .filter(Boolean).join('\n')],
    ]} />
  </div>
}
