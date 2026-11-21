'use client'

import { Autocomplete } from '@base-ui/react/autocomplete'
import { ChevronDown } from 'lucide-react'
import { useRef, useState, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'

type InputAttributes = Pick<ComponentProps<'input'>, 'id' | 'maxLength' | 'aria-invalid' | 'aria-describedby'>

function searchKey(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en')
}

export function SuggestionInput({ name, label, value, onChange, suggestions, ...input }: InputAttributes & {
  name: string; label: string; value: string; onChange: (value: string) => void; suggestions: readonly string[]
}) {
  const container = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const query = searchKey(value)
  const matches = suggestions.map((suggestion) => ({ suggestion, key: searchKey(suggestion) }))
    .filter(({ key }) => key.includes(query))
    .sort((left, right) => Number(right.key.startsWith(query)) - Number(left.key.startsWith(query)))
    .slice(0, 10)
    .map(({ suggestion }) => suggestion)

  return <div ref={container} className="min-w-0">
    <Autocomplete.Root name={name} value={value} onValueChange={onChange} items={suggestions} filteredItems={matches}
      open={open && matches.length > 0} onOpenChange={setOpen}>
      <div className="relative">
        <Autocomplete.Input {...input} render={<Input placeholder="Choose or enter your own" className={matches.length ? 'h-10 pe-10' : 'h-10'} />} />
        {matches.length > 0 && <Autocomplete.Trigger aria-label={`Show ${label.toLowerCase()} suggestions`} className="absolute end-1 top-0 inline-flex h-full w-8 items-center justify-center rounded text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <ChevronDown aria-hidden="true" className="size-4" />
        </Autocomplete.Trigger>}
      </div>
      <Autocomplete.Portal container={container}>
        <Autocomplete.Positioner sideOffset={4} align="start" className="z-50">
          <Autocomplete.Popup className="max-h-[min(16rem,var(--available-height))] w-(--anchor-width) overflow-auto rounded-md border bg-popover p-1 text-sm text-popover-foreground shadow-md">
            <Autocomplete.List>
              {(suggestion: string) => <Autocomplete.Item key={suggestion} value={suggestion}
                className="min-h-10 cursor-default rounded px-2 py-2 outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground">
                {suggestion}
              </Autocomplete.Item>}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  </div>
}
