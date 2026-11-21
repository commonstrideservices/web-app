import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { directoryUrl, type SearchParams } from '@/features/admin/directory'
import { companyMetadataFields, companySections } from '@/features/crm/components/form-fields'
import { RecordHeader } from '@/features/crm/components/record-details'
import { RecordForm } from '@/features/crm/components/record-form'
import { CrmServerAction } from '@/features/crm/crm-server-action'
import { directoryReturn } from '@/features/crm/directory'
import { companyMetadataSchema, recordIdSchema } from '@/features/crm/model'
import { requireCrmAdministrator } from '@/features/crm/server/access'
import { companyFieldOptions, getCompany } from '@/features/crm/server/directory-service'

export const metadata: Metadata = { title: 'Edit company' }

export default async function EditCompanyPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<SearchParams>
}) {
  await requireCrmAdministrator()
  const id = recordIdSchema.safeParse((await params).id)
  if (!id.success) notFound()
  const [company, options] = await Promise.all([getCompany(id.data), companyFieldOptions()])
  if (!company) notFound()
  const { record } = company
  const from = directoryReturn((await searchParams).from, '/admin/companies')
  const cancel = directoryUrl(`/admin/companies/${record.id}`, { from })
  const { name, website, relationship, industry, country } = record
  const initial = { name, website, relationship, industry, country, ...companyMetadataFields(companyMetadataSchema.parse(record.metadata)) }

  return <div className="grid gap-5">
    <RecordHeader title="Edit company" from={cancel} backLabel="Back to company" />
    <RecordForm key={record.updated_at} action={CrmServerAction.saveCompany.bind(null, record.id, record.updated_at, from)}
      sections={companySections(options)} initial={initial} cancel={cancel} submitLabel="Save company" />
  </div>
}
