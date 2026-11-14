import Image from 'next/image'
import { z } from 'zod'
import source from '../config/client-companies.json'
import { Reveal } from './site-motion'

const companyList = z.array(z.object({
  name: z.string().trim().min(1),
  logo: z.string().startsWith('/images/').optional(),
  services: z.array(z.string().trim().min(1)).default([]),
})).parse(source)

const previewCompanies: typeof companyList = [
  { name: 'Lumenridge Studio', services: ['Static Web Development', 'Content Planning'] },
  { name: 'Cedarloop Supply', services: ['Lead List Building', 'Data Enrichment & Cleanup'] },
  { name: 'Harborfold Media', services: ['Post Design & Scheduling', 'Community Management'] },
  { name: 'Northvale Works', services: ['Inbox & Calendar Management', 'Customer Support'] },
]

export function ClientCompanies() {
  const isPreview = companyList.length === 0
  const companies = isPreview ? previewCompanies : companyList

  return (
    <section id="who-we-work-with" className="scroll-mt-8 bg-white" aria-labelledby="client-companies-heading">
      <Reveal className="site-shell py-12 sm:py-16">
        <h2 id="client-companies-heading" className="font-heading text-3xl font-extrabold tracking-[-0.06em] sm:text-4xl">Who we work with</h2>
        {isPreview && <p className="mt-2 text-sm text-copy">Sample companies</p>}
        <ul className="mt-6 grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-4" role="list">
          {companies.map(({ name, logo, services }) => {
            const initials = name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()

            return (
              <li key={name} className="flex min-w-0 flex-col items-center rounded-2xl border border-rule px-3 py-5 text-center sm:p-6">
                <div className="grid h-20 w-full max-w-40 shrink-0 place-items-center sm:h-24" aria-hidden="true">
                  {logo ? (
                    <Image src={logo} alt="" width={160} height={96} className="h-full w-full object-contain" />
                  ) : (
                    <span className="grid size-16 place-items-center rounded-2xl bg-brand-soft font-heading text-3xl font-extrabold tracking-tight text-ink sm:size-20 sm:text-4xl">
                      {initials}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold wrap-anywhere sm:text-base">{name}</p>
                {services.length > 0 && (
                  <ul className="mt-auto flex flex-wrap justify-center gap-2 pt-4" aria-label={`Services for ${name}`}>
                    {services.map((service) => <li key={service} className="site-badge max-w-full wrap-anywhere">{service}</li>)}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </Reveal>
    </section>
  )
}
