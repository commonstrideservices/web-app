import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { serviceCatalog } from '@/features/catalog/catalog'
import { Brand } from '@/features/site/components/brand'
import { MobileNavigation } from '@/features/site/components/mobile-navigation'
import { SectionLink } from '@/features/site/components/section-link'

const siteSections = [
  { id: 'services', label: 'Services' },
  { id: 'who-we-work-with', label: 'Who we work with' },
  { id: 'stride-code', label: 'How We Work' },
  { id: 'faq', label: 'FAQ' },
]

function SiteHeader() {
  return (
    <header className="border-b border-rule bg-white">
      <div className="site-shell grid grid-cols-[1fr_auto] items-center gap-x-4 py-2.5 lg:min-h-[5.25rem] lg:grid-cols-[1fr_auto_1fr] lg:gap-x-6 lg:py-3">
        <div className="flex items-center">
          <Brand />
        </div>
        <nav aria-label="Main navigation" className="hidden lg:block">
          <ul className="flex justify-center gap-x-5 text-center text-sm font-medium text-copy xl:gap-x-8">
            {siteSections.map(({ id, label }) => (
              <li key={id}>
                <SectionLink section={id} className="inline-flex min-h-11 items-center justify-center rounded-md px-2 leading-snug hover:bg-paper hover:text-ink">
                  {label}
                </SectionLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2 justify-self-end">
          <Link href="/connect" className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-rule px-4 text-sm font-semibold whitespace-nowrap hover:border-brand hover:bg-paper">
            Let’s talk <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <MobileNavigation sections={siteSections} />
        </div>
      </div>
    </header>
  )
}

function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-rule bg-white">
      <div className="site-shell">
        <div className="grid gap-8 py-10 sm:grid-cols-[1fr_1.6fr] sm:gap-10 sm:py-12 lg:grid-cols-2">
          <div>
            <Brand />
          </div>
          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-4 sm:gap-x-8">
            <div>
              <p className="mb-1 text-sm font-bold text-ink">Explore</p>
              <ul className="text-sm text-copy">
                {siteSections.map(({ id, label }) => (
                  <li key={id}>
                    <SectionLink section={id} className="inline-flex min-h-11 items-center rounded-md py-1 leading-snug hover:text-ink hover:underline">{label}</SectionLink>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-sm font-bold text-ink">Our services</p>
              <ul className="text-sm text-copy">
                {serviceCatalog.map(({ id, name }) => (
                  <li key={id}>
                    <Link href={`/${id}`} className="inline-flex min-h-11 items-center rounded-md py-1 leading-snug hover:text-ink hover:underline">{name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-rule py-3 text-sm text-copy">
          <p className="py-2">© {year} Common Stride. All rights reserved.</p>
          <nav aria-label="Policies and staff access">
            <ul className="flex flex-wrap gap-x-5">
              <li><Link href="/privacy-policy" className="inline-flex min-h-11 items-center rounded-md hover:text-ink hover:underline">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="inline-flex min-h-11 items-center rounded-md hover:text-ink hover:underline">Terms of Service</Link></li>
              <li><Link href="/admin/login" className="inline-flex min-h-11 items-center rounded-md hover:text-ink hover:underline">Staff sign-in</Link></li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:bg-white focus:p-3">Skip to content</a>
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </>
  )
}
