import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { directoryUrl, type SearchParams } from '@/features/admin/directory'
import { contactMetadataFields, contactSections } from '@/features/crm/components/form-fields'
import { RecordHeader } from '@/features/crm/components/record-details'
import { RecordForm } from '@/features/crm/components/record-form'
import { CrmServerAction } from '@/features/crm/crm-server-action'
import { directoryReturn } from '@/features/crm/directory'
import { contactMetadataSchema, recordIdSchema } from '@/features/crm/model'
import { requireCrmAdministrator } from '@/features/crm/server/access'
import { getContact } from '@/features/crm/server/directory-service'

export const metadata: Metadata = { title: 'Edit contact' }

export default async function EditContactPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<SearchParams>
}) {
  await requireCrmAdministrator()
  const id = recordIdSchema.safeParse((await params).id)
  if (!id.success) notFound()
  const contact = await getContact(id.data)
  if (!contact) notFound()
  const { record, company } = contact
  const from = directoryReturn((await searchParams).from, '/admin/contacts')
  const cancel = directoryUrl(`/admin/contacts/${record.id}`, { from })
  const { name, email, affiliation } = record
  const initial = { name, email, affiliation, ...contactMetadataFields(contactMetadataSchema.parse(record.metadata)) }

  return <div className="grid gap-5">
    <RecordHeader title="Edit contact" from={cancel} backLabel="Back to contact" />
    <RecordForm key={record.updated_at} action={CrmServerAction.saveContact.bind(null, record.id, record.updated_at, from)}
      sections={contactSections} initial={initial} company={company} cancel={cancel} submitLabel="Save contact" />
  </div>
}
