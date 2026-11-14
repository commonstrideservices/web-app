'use client'

import Link from 'next/link'

export function SectionLink({ section, className, children, onNavigate }: {
  section: string
  className?: string
  children: React.ReactNode
  onNavigate?: () => void
}) {
  const fragment = `#${section}`

  return (
    <Link href={`/${fragment}`} className={className} onNavigate={(event) => {
      onNavigate?.()
      if (window.location.pathname !== '/' || window.location.hash !== fragment) return
      const target = document.getElementById(section)
      if (!target) return

      event.preventDefault()
      target.scrollIntoView()
    }}>
      {children}
    </Link>
  )
}
