import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { serviceCatalog } from '@/features/catalog/catalog'
import { JsonLd } from '@/features/site/components/json-ld'
import { SectionLink } from '@/features/site/components/section-link'
import { Reveal, SiteMotion } from '@/features/site/components/site-motion'
import { organizationId, publicPageMetadata, siteName, siteUrl } from '@/features/site/metadata'

type ServicePageProps = { params: Promise<{ service: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return serviceCatalog.map(({ id }) => ({ service: id }))
}

async function getService(params: ServicePageProps['params']) {
  const { service } = await params
  const category = serviceCatalog.find(({ id }) => id === service)
  if (!category) notFound()
  return category
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const category = await getService(params)
  return publicPageMetadata({
    path: `/${category.id}`,
    title: category.seo?.title ?? category.name,
    description: category.seo?.description ?? category.description,
  })
}

export default async function ServicePage({ params }: ServicePageProps) {
  const category = await getService(params)

  return (
    <SiteMotion>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: category.name,
        url: new URL(`/${category.id}`, siteUrl).href,
        description: category.seo?.description ?? category.description,
        provider: { '@type': 'Organization', '@id': organizationId, name: siteName },
      }} />
      <section className="site-shell pt-8 pb-12 sm:pt-11 sm:pb-16">
        <SectionLink section="services" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-copy underline-offset-4 decoration-brand hover:underline">
          <ArrowLeft size={16} className="shrink-0" aria-hidden="true" /> All services
        </SectionLink>
        <div className="mt-4 grid overflow-hidden rounded-[1.5rem] border border-rule bg-paper lg:grid-cols-2">
          <Reveal trigger="load" className="flex flex-col items-start justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-12">
            <h1 className="max-w-[13ch] font-heading text-[clamp(2.75rem,6.5vw,5.5rem)] leading-[0.96] font-extrabold tracking-[-0.07em]">
              {category.name}<span className="text-brand">.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-copy sm:text-lg">{category.hero.introduction}</p>
            <Link href="/connect" className="site-button mt-7">
              Start an inquiry <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </Reveal>
          <div className="relative min-h-[15rem] overflow-hidden bg-brand-soft sm:min-h-[21rem] lg:min-h-[26rem]">
            <Reveal image trigger="load" delay={0.08} className="absolute inset-0">
              <Image src={category.hero.image} alt={category.hero.alt} fill priority
                sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="site-shell pb-16 sm:pb-24" aria-labelledby="service-offerings">
        <Reveal>
          <h2 id="service-offerings" className="font-heading text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl">What we can help with</h2>
        </Reveal>
        <div className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule lg:grid-cols-3">
          {category.offerings.map((offering, index) => (
            <article key={offering.id} id={offering.id} className="scroll-mt-8 min-w-0 bg-white px-6 py-7 sm:p-8">
              <Reveal delay={index * 0.07}>
                <h3 className="font-heading text-[1.65rem] leading-tight font-bold tracking-[-0.045em]">{offering.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-copy sm:text-base">{offering.description}</p>
                <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink marker:text-brand">
                  {offering.examples.map((example) => <li key={example}>{example}</li>)}
                </ul>
              </Reveal>
            </article>
          ))}
        </div>
      </section>
    </SiteMotion>
  )
}
