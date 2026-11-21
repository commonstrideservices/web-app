import type { Metadata } from 'next'
import type { SearchParams } from '@/features/admin/directory'
import { companySections } from '@/features/crm/components/form-fields'
import { RecordHeader } from '@/features/crm/components/record-details'
import { RecordForm } from '@/features/crm/components/record-form'
import { CrmServerAction } from '@/features/crm/crm-server-action'
import { directoryReturn } from '@/features/crm/directory'
import { requireCrmAdministrator } from '@/features/crm/server/access'
import { companyFieldOptions } from '@/features/crm/server/directory-service'

export const metadata: Metadata = { title: 'Add company' }

export default async function NewCompanyPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireCrmAdministrator()
  const from = directoryReturn((await searchParams).from, '/admin/companies')
  const options = await companyFieldOptions()

  return <div className="grid gap-5">
    <RecordHeader title="Add company" from={from} backLabel="Back to companies" />
    <RecordForm action={CrmServerAction.saveCompany.bind(null, null, null, from)} sections={companySections(options)}
      initial={{ relationship: 'unclassified' }} cancel={from} submitLabel="Add company" />
  </div>
}
