import type { Metadata } from 'next'
import type { SearchParams } from '@/features/admin/directory'
import { contactSections } from '@/features/crm/components/form-fields'
import { RecordHeader } from '@/features/crm/components/record-details'
import { RecordForm } from '@/features/crm/components/record-form'
import { CrmServerAction } from '@/features/crm/crm-server-action'
import { directoryReturn } from '@/features/crm/directory'
import { recordIdSchema } from '@/features/crm/model'
import { requireCrmAdministrator } from '@/features/crm/server/access'
import { getCompanyOption } from '@/features/crm/server/directory-service'

export const metadata: Metadata = { title: 'Add contact' }

export default async function NewContactPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireCrmAdministrator()
  const params = await searchParams
  const id = recordIdSchema.safeParse(params.company)
  const company = id.success ? await getCompanyOption(id.data) : undefined
  const from = directoryReturn(params.from, '/admin/contacts')
  const backLabel = from.startsWith('/admin/companies/') ? 'Back to company' : 'Back to contacts'

  return <div className="grid gap-5">
    <RecordHeader title="Add contact" from={from} backLabel={backLabel} />
    <RecordForm action={CrmServerAction.saveContact.bind(null, null, null, from)} sections={contactSections}
      initial={{ affiliation: 'unknown' }} company={company} cancel={from} submitLabel="Add contact" />
  </div>
}
