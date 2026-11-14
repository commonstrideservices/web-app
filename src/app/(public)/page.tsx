import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight, Globe2, HandHelping, Layers3, Megaphone, type LucideIcon } from 'lucide-react'
import { serviceCatalog } from '@/features/catalog/catalog'
import { ClientCompanies } from '@/features/site/components/client-companies'
import { FrequentlyAskedQuestions } from '@/features/site/components/frequently-asked-questions'
import { JsonLd } from '@/features/site/components/json-ld'
import { SectionLink } from '@/features/site/components/section-link'
import { Reveal, SiteMotion } from '@/features/site/components/site-motion'
import { StrideCode } from '@/features/site/components/stride-code'
import { ToolLogos } from '@/features/site/components/tool-logos'
import { homeDescription, organizationId, publicPageMetadata, siteName, siteUrl } from '@/features/site/metadata'

export const metadata = publicPageMetadata({ path: '/', description: homeDescription })

const serviceIcons: Partial<Record<string, LucideIcon>> = {
  'web-services': Globe2,
  'social-media': Megaphone,
  'lead-data-resources': Layers3,
  'va-services': HandHelping,
}

export default function HomePage() {
  return (
    <SiteMotion>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': organizationId,
            name: siteName,
            url: siteUrl.href,
            logo: new URL('/logo.png', siteUrl).href,
            description: homeDescription,
          },
          {
            '@type': 'WebSite',
            '@id': new URL('/#website', siteUrl).href,
            name: siteName,
            url: siteUrl.href,
            publisher: { '@id': organizationId },
          },
        ],
      }} />
      <section className="site-shell grid gap-10 bg-white py-12 sm:py-16 lg:min-h-[41rem] lg:grid-cols-[1fr_0.88fr] lg:items-center lg:gap-16 lg:py-14">
        <div>
          <Reveal trigger="load">
            <p className="mb-5 text-xs font-semibold tracking-[0.16em] text-ink uppercase">Services &amp; Digital Solution</p>
          </Reveal>
          <Reveal trigger="load" delay={0.06}>
            <h1 className="max-w-[11ch] font-heading text-[clamp(3.5rem,8vw,7.15rem)] leading-[0.93] font-extrabold tracking-[-0.075em]">
              Move your business forward<span className="text-brand">.</span>
            </h1>
          </Reveal>
          <Reveal trigger="load" delay={0.13}>
            <p className="mt-7 max-w-[29rem] text-base leading-[1.7] text-copy sm:text-lg">
              Get help building and maintaining your website, managing social media, researching leads, and handling day-to-day tasks with virtual assistants.
            </p>
          </Reveal>
          <Reveal trigger="load" delay={0.2} className="mt-8 flex flex-wrap items-center gap-5 sm:gap-7">
            <Link href="/connect" className="site-button">Start an inquiry <ArrowUpRight size={17} className="shrink-0" aria-hidden="true" /></Link>
            <SectionLink section="services" className="inline-flex items-center gap-2 text-sm font-semibold hover:text-brand">
              Explore services <ArrowDown size={15} aria-hidden="true" />
            </SectionLink>
          </Reveal>
        </div>
        <div className="relative min-h-[20rem] overflow-hidden rounded-[1.4rem] bg-paper sm:aspect-[4/3] lg:aspect-auto lg:h-full">
          <Reveal image trigger="load" delay={0.08} className="absolute inset-0">
            <Image src="/images/team-at-work.webp" fill priority sizes="(min-width: 1320px) 570px, (min-width: 1024px) 45vw, calc(100vw - 2.5rem)"
              alt="Three colleagues review a project checklist beside a sunlit staircase" className="object-cover object-[center_40%]" />
          </Reveal>
        </div>
      </section>

      <section id="services" className="scroll-mt-8 border-y border-rule bg-paper">
        <div className="site-shell py-16 sm:py-23">
          <Reveal><h2 className="font-heading text-4xl font-extrabold tracking-[-0.06em] sm:text-6xl">Our services</h2></Reveal>
          <div className="mt-9 grid auto-rows-fr gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2">
            {serviceCatalog.map((category, index) => {
              const Icon = serviceIcons[category.id] ?? Layers3
              return (
                <article key={category.id} className="min-w-0 bg-white p-6 sm:p-8">
                  <Reveal className="flex h-full flex-col items-start" delay={index % 2 * 0.08}>
                    <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={20} aria-hidden="true" /></span>
                    <h3 className="mt-5 font-heading text-[1.65rem] leading-none font-bold tracking-[-0.045em]">{category.name}</h3>
                    <p className="mt-3 max-w-lg text-[0.94rem] leading-relaxed text-copy">{category.description}</p>
                    <div className="mt-auto grid justify-items-start gap-3 pt-4">
                      {category.offerings.length > 0 && (
                        <ul className="flex flex-wrap gap-2" aria-label={`${category.name} offerings`}>
                          {category.offerings.map((offering) => (
                            <li className="site-badge" key={offering.id}>{offering.name}</li>
                          ))}
                        </ul>
                      )}
                      <Link href={`/${category.id}`} aria-label={`Learn more about ${category.name}`}
                        className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold underline-offset-4 decoration-brand hover:underline">
                        Learn more <ArrowRight size={16} className="shrink-0 text-brand" aria-hidden="true" />
                      </Link>
                    </div>
                  </Reveal>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <ClientCompanies />

      <StrideCode />

      <FrequentlyAskedQuestions />

      <section className="border-t border-rule bg-paper" aria-labelledby="inquiry-heading">
        <Reveal className="site-shell flex flex-wrap items-center justify-between gap-6 py-12 sm:py-16">
          <div className="min-w-0">
            <h2 id="inquiry-heading" className="font-heading text-3xl font-extrabold tracking-[-0.055em] sm:text-4xl">Still have questions?</h2>
            <p className="mt-2 text-sm leading-relaxed text-copy sm:text-base">
              We’d be glad to talk it through. Email us at{' '}
              <a href="mailto:info@commonstrideservice.com" className="font-semibold wrap-anywhere text-brand no-underline">info@commonstrideservice.com</a>.
            </p>
          </div>
          <Link href="/connect" className="site-button">Request a free discovery call <ArrowRight size={17} className="shrink-0" aria-hidden="true" /></Link>
        </Reveal>
      </section>
      <ToolLogos />
    </SiteMotion>
  )
}
