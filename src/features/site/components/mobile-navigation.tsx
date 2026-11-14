'use client'

import { ArrowDownRight, Menu, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { SectionLink } from './section-link'

export function MobileNavigation({ sections }: { sections: readonly { id: string; label: string }[] }) {
  const disclosure = useRef<HTMLDetailsElement>(null)

  function closeMenu() {
    if (disclosure.current) disclosure.current.open = false
  }

  useEffect(() => {
    function closeOnOutsidePress(event: PointerEvent) {
      const menu = disclosure.current
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) {
        menu.open = false
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePress)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress)
  }, [])

  return (
    <details
      ref={disclosure}
      className="group relative lg:hidden"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) closeMenu()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !event.currentTarget.open) return
        event.preventDefault()
        closeMenu()
        event.currentTarget.querySelector('summary')?.focus()
      }}
    >
      <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-full border border-rule text-ink hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand group-open:bg-paper [&::-webkit-details-marker]:hidden">
        <span className="sr-only">Menu</span>
        <Menu size={20} aria-hidden="true" className="group-open:hidden" />
        <X size={20} aria-hidden="true" className="hidden group-open:block" />
      </summary>

      <nav aria-label="Main navigation" className="absolute top-full right-0 z-20 mt-3 w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border border-rule bg-white p-2 shadow-lg shadow-ink/10">
        <ul className="divide-y divide-rule text-sm font-semibold text-ink">
          {sections.map(({ id, label }) => (
            <li key={id} className="py-0.5">
              <SectionLink section={id} onNavigate={closeMenu} className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 hover:bg-paper">
                {label} <ArrowDownRight size={16} aria-hidden="true" className="shrink-0 text-brand" />
              </SectionLink>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  )
}
