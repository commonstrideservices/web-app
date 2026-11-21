import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buttonVariants } from './button'
import { cn } from '@/lib/utils'

export function Pagination({ page, pages, previous, next }: {
  page: number; pages: number; previous?: string; next?: string
}) {
  return (
    <nav aria-label="Result pages">
      <ul className="flex items-center gap-1">
        <PageLink href={previous} label="Previous page" icon={ChevronLeft} />
        <li className="px-1 text-center text-sm tabular-nums">Page {page} of {pages}</li>
        <PageLink href={next} label="Next page" icon={ChevronRight} />
      </ul>
    </nav>
  )
}

function PageLink({ href, label, icon: Icon }: { href?: string; label: string; icon: typeof ChevronLeft }) {
  const className = buttonVariants({ variant: 'outline', size: 'icon' })
  return <li>
    {href ? <Link href={href} aria-label={label} className={className}><Icon aria-hidden="true" /></Link>
      : <span aria-label={label} aria-disabled="true" className={cn(className, 'opacity-45')}><Icon aria-hidden="true" /></span>}
  </li>
}
