import { Reveal } from './site-motion'

const strideCodes = [
  {
    title: 'Virtual Assistance',
    values: [
      { name: 'Service', description: 'We take ownership of our clients’ goals as if they were our own.' },
      { name: 'Trust', description: 'We handle every inbox, file, and lead with confidentiality and discretion.' },
      { name: 'Reliability', description: 'We show up, meet deadlines, and speak up early if something might slip.' },
      { name: 'Initiative', description: 'We anticipate needs and take the next step when we can.' },
      { name: 'Development', description: 'We keep learning new tools and skills so the support you receive improves over time.' },
      { name: 'Excellence', description: 'We deliver polished work on time and check it twice before it goes out.' },
    ],
  },
  {
    title: 'Technology',
    values: [
      { name: 'Security', description: 'We protect client data, access, and systems, with secure practices built in from day one.' },
      { name: 'Transparency', description: 'We share clear timelines, honest estimates, and plain-English updates so you know where your project stands.' },
      { name: 'Reliability', description: 'We build dependable software and test changes before we ship them.' },
      { name: 'Innovation', description: 'We choose practical tools and automations that save you time and money.' },
      { name: 'Design-minded', description: 'We design clean, intuitive experiences that are easy to use.' },
      { name: 'Excellence', description: 'We build and document software so your team can maintain and grow it long after launch.' },
    ],
  },
]

export function StrideCode() {
  return (
    <section id="stride-code" className="scroll-mt-8 border-y border-rule bg-paper" aria-labelledby="stride-code-heading">
      <div id="approach" className="site-shell scroll-mt-8 py-16 sm:py-23">
        <Reveal>
          <h2 id="stride-code-heading" className="font-heading text-4xl font-extrabold tracking-[-0.06em] sm:text-6xl">How We Work</h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-copy sm:text-lg">
            Our STRIDE code lays out six principles for each team.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-5 lg:grid-cols-2 lg:gap-6">
          {strideCodes.map(({ title, values }, index) => (
            <div key={title} className="min-w-0 rounded-2xl border border-rule bg-white p-5 sm:p-8">
              <Reveal>
                <h3 className="font-heading text-2xl font-bold tracking-[-0.04em] sm:text-3xl">{title}</h3>
              </Reveal>
              <dl className="mt-5 divide-y divide-rule border-t border-rule">
                {values.map(({ name, description }) => (
                  <Reveal key={name} className="relative py-4 pl-11 last:pb-0" delay={index * 0.06}>
                    <dt className="pt-0.5 text-base font-semibold">
                      <span aria-hidden="true" className="absolute top-4 left-0 grid size-8 place-items-center rounded-lg bg-brand-soft font-heading font-bold text-ink">
                        {name[0]}
                      </span>
                      {name}
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed text-copy sm:text-base">{description}</dd>
                  </Reveal>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
