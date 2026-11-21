import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requireStaff } from '@/features/accounts/server/session-service'
import { DirectoryPage } from '@/features/admin/components/directory-page'
import { directoryUrl, type SearchParams } from '@/features/admin/directory'
import { ContactTable } from '@/features/crm/components/directory-tables'
import { contactQuerySchema } from '@/features/crm/directory'
import { listContacts } from '@/features/crm/server/directory-service'

export const metadata: Metadata = { title: 'Contacts' }

export default async function ContactsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, staff] = await Promise.all([searchParams, requireStaff()])
  const pathname = '/admin/contacts'
  const query = contactQuerySchema.parse(params)
  const result = await listContacts(query)
  const { metrics } = result
  const from = directoryUrl(pathname, { ...query, page: result.page })

  return <DirectoryPage title="Contacts" metrics={[
    { label: 'Total contacts', value: metrics.total },
    { label: 'Stale contacts', value: metrics.stale },
    { label: 'Without email', value: metrics.withoutEmail },
  ]} action={staff.role === 'admin' && <Button asChild size="lg">
    <Link href={directoryUrl('/admin/contacts/new', { from, company: result.selectedCompany?.id })}>
      <Plus aria-hidden="true" /> Add contact
    </Link>
  </Button>}>
    <ContactTable pathname={pathname} query={query} result={result} />
  </DirectoryPage>
}
