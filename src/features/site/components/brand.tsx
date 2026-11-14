import Image from 'next/image'
import Link from 'next/link'

export function Brand({ href = '/', compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex max-w-full items-center overflow-hidden rounded-md ${compact ? 'gap-1.5 text-sm font-semibold' : 'dark:bg-white'}`}
      aria-label={href === '/admin' ? 'Common Stride dashboard' : 'Common Stride home'}
    >
      <Image src="/logo.png" alt="" width={52} height={52} className={compact ? 'size-9 shrink-0' : 'relative size-11 shrink-0 sm:size-13'} />
      {compact
        ? <span className="hidden sm:inline">Common Stride</span>
        : <Image src="/logo-text.png" alt="" width={144} height={48} className="-ms-3 hidden h-auto w-36 min-w-0 sm:block" />}
    </Link>
  )
}
