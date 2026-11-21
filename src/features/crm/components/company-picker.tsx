'use client'

import { Combobox } from '@base-ui/react/combobox'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { CrmServerAction } from '../crm-server-action'
import type { CompanyOption } from '../model'

type SearchResult = { query: string; options: CompanyOption[]; error?: boolean }

export function CompanyPicker({ name, id, initial, invalid, describedBy, placeholder = 'Find a company' }: {
  name: string; id: string; initial?: CompanyOption; invalid?: boolean; describedBy?: string; placeholder?: string
}) {
  const container = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState(initial ?? null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SearchResult>()
  const search = query.trim()
  const options = result?.query === search ? result.options : []
  const loading = result?.query !== search

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const timeout = window.setTimeout(async () => {
      try {
        const options = await CrmServerAction.searchCompanies(search)
        if (!cancelled) setResult({ query: search, options })
      } catch {
        if (!cancelled) setResult({ query: search, options: [], error: true })
      }
    }, search ? 220 : 0)
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [open, search])

  return <div ref={container} className="min-w-0">
    <input type="hidden" name={name} value={selected?.id ?? ''} />
    <Combobox.Root
      items={options} filter={null} autoHighlight value={selected}
      onValueChange={setSelected}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
      onInputValueChange={(text, details) => {
        if (details.reason === 'input-change') setQuery(text)
      }}
      itemToStringLabel={(item) => item.name}
      isItemEqualToValue={(item, value) => item.id === value.id}
    >
      <div className="relative">
        <Combobox.Input id={id} maxLength={150} aria-invalid={invalid || undefined} aria-describedby={describedBy}
          render={<Input placeholder={placeholder} title={selected?.name} className={selected ? 'h-10 pe-16' : 'h-10 pe-9'} />} />
        <div className="absolute end-1 top-0 flex h-full items-center">
          <Combobox.Clear aria-label="Clear selected company" className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
            <X aria-hidden="true" className="size-4" />
          </Combobox.Clear>
          <Combobox.Trigger aria-label="Show companies" className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
            <ChevronsUpDown aria-hidden="true" className="size-4" />
          </Combobox.Trigger>
        </div>
      </div>
      <Combobox.Portal container={container}>
        <Combobox.Positioner sideOffset={4} align="start" className="z-50">
          <Combobox.Popup className="max-h-(--available-height) w-[max(12rem,var(--anchor-width))] max-w-[calc(100vw-2rem)] overflow-auto rounded-md border bg-popover p-1 text-sm text-popover-foreground shadow-md">
            <Combobox.Empty className="px-2 py-3 text-muted-foreground empty:hidden">
              {loading ? 'Searching…' : result?.error ? 'Company search is unavailable. Reopen to try again.' : 'No companies found.'}
            </Combobox.Empty>
            <Combobox.List>
              {(company: CompanyOption) => {
                const description = [company.website?.replace(/^https?:\/\//, '').replace(/\/$/, ''), company.country]
                  .filter(Boolean).join(' · ')
                return <Combobox.Item key={company.id} value={company}
                  className="relative grid min-h-10 cursor-default gap-0.5 rounded px-2 py-1.5 pe-7 outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground">
                  <span className="wrap-anywhere">{company.name}</span>
                  {description && <span className="wrap-anywhere text-xs text-muted-foreground">{description}</span>}
                  <Combobox.ItemIndicator className="absolute end-2 top-2.5"><Check aria-hidden="true" className="size-4" /></Combobox.ItemIndicator>
                </Combobox.Item>
              }}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  </div>
}
