import { redirect } from 'next/navigation'
import { requireEmailAdministrator } from '@/features/email/server/access'

export default async function ConfigurationPage() {
  await requireEmailAdministrator()
  redirect('/admin/configuration/email')
}
