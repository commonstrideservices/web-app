'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MailSelect } from './fields'

export function MailboxSwitcher({ mailboxes, selected, onChange }: {
  mailboxes: { id: string; label: string }[]
  selected: string
  onChange: (id: string) => void
}) {
  return <MailSelect aria-label="Mailbox" value={selected} className="max-w-full sm:max-w-72"
    onChange={(event) => onChange(event.target.value)}>
    {mailboxes.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
  </MailSelect>
}

export function RefreshMailbox({ refresh }: { refresh: () => void }) {
  return <Button aria-label="Refresh email" title="Refresh email" size="icon" variant="outline" onClick={refresh}>
    <RefreshCw aria-hidden="true" />
  </Button>
}
