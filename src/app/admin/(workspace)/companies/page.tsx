import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requireStaff } from '@/features/accounts/server/session-service'
import { DirectoryPage } from '@/features/admin/components/directory-page'
import { directoryUrl, type SearchParams } from '@/features/admin/directory'
import { CompanyTable } from '@/features/crm/components/directory-tables'
import { companyQuerySchema } from '@/features/crm/directory'
import { listCompanies } from '@/features/crm/server/directory-service'

export const metadata: Metadata = { title: 'Companies' }

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, staff] = await Promise.all([searchParams, requireStaff()])
  const query = companyQuerySchema.parse(params)
  const result = await listCompanies(query)
  const { metrics } = result
  const from = directoryUrl('/admin/companies', { ...query, page: result.page })

  return <DirectoryPage title="Companies" metrics={[
    { label: 'Total companies', value: metrics.total },
    { label: 'Stale companies', value: metrics.stale },
    { label: 'Without contacts', value: metrics.withoutContacts },
  ]} action={staff.role === 'admin' && <Button asChild size="lg">
    <Link href={directoryUrl('/admin/companies/new', { from })}><Plus aria-hidden="true" /> Add company</Link>
  </Button>}>
    <CompanyTable query={query} result={result} />
  </DirectoryPage>
}
