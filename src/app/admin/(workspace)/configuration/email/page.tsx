import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminStatusBadge } from '@/features/admin/components/admin-status'
import { DeleteTemplateForm, MailboxCommands, MailboxForm, ProfessionalTemplateForm, TemplateForm } from '@/features/email/components/settings-forms'
import { professionalTemplate } from '@/features/email/config/professional-template'
import { requireEmailAdministrator } from '@/features/email/server/access'
import { getEmailConnectionDefaults, listMailboxes } from '@/features/email/server/settings'
import { getTemplateLibrary } from '@/features/email/server/templates'

export const metadata: Metadata = { title: 'Email configuration' }
export const runtime = 'nodejs'

const base = '/admin/configuration/email'
const templatesUrl = `${base}?section=templates`

export default async function EmailSettingsPage({ searchParams }: {
  searchParams: Promise<{ section?: string; mailbox?: string; template?: string }>
}) {
  await requireEmailAdministrator()
  const params = await searchParams
  const showTemplates = params.section === 'templates'

  return <div className="grid gap-5">
    <header className="grid gap-2">
      <p className="text-sm font-medium text-muted-foreground">App Configuration</p>
      <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Email</h1>
    </header>
    <nav aria-label="Email configuration" className="flex flex-wrap gap-2">
      <Button asChild variant={showTemplates ? 'ghost' : 'secondary'}>
        <Link href={base} aria-current={showTemplates ? undefined : 'page'}>Mailboxes</Link>
      </Button>
      <Button asChild variant={showTemplates ? 'secondary' : 'ghost'}>
        <Link href={templatesUrl} aria-current={showTemplates ? 'page' : undefined}>Templates</Link>
      </Button>
    </nav>
    {showTemplates ? <TemplateSettings templateId={params.template} />
      : <MailboxSettings mailboxId={params.mailbox} />}
  </div>
}

async function MailboxSettings({ mailboxId }: { mailboxId?: string }) {
  const [mailboxes, defaults] = await Promise.all([listMailboxes(), getEmailConnectionDefaults()])
  const selected = mailboxes.find((mailbox) => mailbox.id === mailboxId)
  const replacements = mailboxes.filter((mailbox) => mailbox.enabled && mailbox.id !== selected?.id)
    .map(({ id, display_name }) => ({ id, display_name }))

  return <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle role="heading" aria-level={2}>Hosted mailboxes</CardTitle>
        {selected && <Button asChild size="sm" variant="outline"><Link href={base}>Add mailbox</Link></Button>}
      </CardHeader>
      <CardContent>
        {mailboxes.length === 0 && <p className="text-sm text-muted-foreground">Connect a Porkbun hosted mailbox to get started.</p>}
        <ul className="divide-y">
          {mailboxes.map((mailbox) => <li key={mailbox.id} className="grid gap-2 py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`${base}?mailbox=${mailbox.id}`} className="min-w-0 break-words font-medium hover:underline"
                aria-current={selected?.id === mailbox.id ? 'page' : undefined}>{mailbox.display_name}</Link>
              {mailbox.is_default && <AdminStatusBadge tone="info">Default</AdminStatusBadge>}
              {!mailbox.enabled && <Badge variant="outline">Disabled</Badge>}
            </div>
            <p className="break-all text-sm text-muted-foreground">{mailbox.address}</p>
            <MailboxCommands mailbox={mailbox} />
          </li>)}
        </ul>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle role="heading" aria-level={2}>{selected ? 'Edit mailbox' : 'Add mailbox'}</CardTitle></CardHeader>
      <CardContent><MailboxForm key={selected?.id ?? 'new'} mailbox={selected} defaults={defaults} replacements={replacements} /></CardContent>
    </Card>
  </div>
}

async function TemplateSettings({ templateId }: { templateId?: string }) {
  const templates = await getTemplateLibrary()
  const template = templates.find((item) => item.id === templateId)

  return <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle role="heading" aria-level={2}>Saved templates</CardTitle>
        <Button asChild size="sm" variant="outline"><Link href={templatesUrl}>Add template</Link></Button>
      </CardHeader>
      <CardContent className="grid gap-3">
        {!templates.some((item) => item.id === professionalTemplate.id) && <ProfessionalTemplateForm />}
        {templates.length === 0 && <p className="text-sm text-muted-foreground">No saved templates.</p>}
        <ul className="divide-y">
          {templates.map((item) => <li key={item.id}>
            <Link href={`${templatesUrl}&template=${item.id}`} aria-current={template?.id === item.id ? 'page' : undefined}
              className="block break-words py-2 text-sm font-medium hover:underline">{item.name}</Link>
          </li>)}
        </ul>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle role="heading" aria-level={2}>{template ? 'Edit template' : 'Add template'}</CardTitle></CardHeader>
      <CardContent key={template?.id ?? 'new-template'} className="grid gap-4">
        <TemplateForm template={template} />
        {template && <DeleteTemplateForm template={template} />}
      </CardContent>
    </Card>
  </div>
}
