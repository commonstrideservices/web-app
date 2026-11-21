import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requireStaff } from '@/features/accounts/server/session-service'
import { directoryUrl, type SearchParams } from '@/features/admin/directory'
import {
  mailLink, RecordDetails, RecordHeader, recordLinkClass, webLink,
} from '@/features/crm/components/record-details'
import { UpdatedDate } from '@/features/crm/components/updated-date'
import { directoryReturn } from '@/features/crm/directory'
import { contactAffiliationLabels, contactMetadataSchema, recordIdSchema } from '@/features/crm/model'
import { getContact } from '@/features/crm/server/directory-service'

export const metadata: Metadata = { title: 'Contact details' }

export default async function ContactPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<SearchParams>
}) {
  const [route, search, staff] = await Promise.all([params, searchParams, requireStaff()])
  const id = recordIdSchema.safeParse(route.id)
  if (!id.success) notFound()
  const contact = await getContact(id.data)
  if (!contact) notFound()

  const { record, company, stale } = contact
  const parentPath = `/admin/companies/${company.id}`
  const from = directoryReturn(search.from, '/admin/contacts')
  const fromCompany = from.startsWith('/admin/companies/')
  const companyLink = from.split('?')[0] === parentPath ? from : fromCompany ? parentPath : directoryUrl(parentPath, { from })
  const details = contactMetadataSchema.parse(record.metadata)
  const pathname = `/admin/contacts/${record.id}`

  return <div className="grid min-w-0 gap-5">
    <RecordHeader title={record.name} from={from} backLabel={fromCompany ? 'Back to company' : 'Back to contacts'}
      saved={search.saved === '1'}
      action={staff.role === 'admin' && <Button asChild variant="outline">
        <Link href={directoryUrl(pathname + '/edit', { from })}><Pencil aria-hidden="true" /> Edit contact</Link>
      </Button>}>
      <Link href={companyLink}
        className={`flex min-h-8 w-fit min-w-0 items-center gap-2 ${recordLinkClass}`}>
        <Building2 aria-hidden="true" className="size-4 shrink-0" /><span className="wrap-anywhere">{company.name}</span>
      </Link>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>Last updated</span><UpdatedDate timestamp={record.updated_at} stale={stale} detailed />
      </div>
    </RecordHeader>
    <RecordDetails title="Contact information" fields={[
      ['Affiliation', contactAffiliationLabels[record.affiliation]], ['Preferred first name', details.preferredName],
      ['Job title', details.jobTitle], ['Department', details.department], ['Work email', mailLink(record.email)],
      ['Phone', details.phone], ['LinkedIn', webLink(details.socials?.linkedIn, 'View LinkedIn profile')],
      ['Internal notes', details.notes],
    ]} />
  </div>
}
