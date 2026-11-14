import Image from 'next/image'
import { z } from 'zod'
import source from '../config/people.json'
import { Reveal } from './site-motion'

const people = z.array(z.object({
  nickname: z.string().trim().min(1),
  specialty: z.string().trim().min(1),
  photo: z.string().startsWith('/images/people/'),
})).parse(source)

export function MeetTheAssistants() {
  if (people.length === 0) return null

  return (
    <section id="meet-the-assistants" aria-labelledby="assistants-heading" className="scroll-mt-8 bg-white">
      <div className="site-shell py-16 sm:py-23">
        <Reveal>
          <h2 id="assistants-heading" className="font-heading text-4xl font-extrabold tracking-[-0.06em] sm:text-6xl">Meet the Assistants</h2>
          <p className="mt-3 text-base text-copy sm:text-lg">
            Find the right support for your business, from everyday tasks to specialized work.
          </p>
        </Reveal>

        <ul role="list" className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-5">
          {people.map(({ nickname, specialty, photo }, index) => (
            <li key={photo} className="min-w-0 rounded-2xl border border-rule bg-white">
              <Reveal delay={index % 3 * 0.06} className="flex items-center gap-4 p-4 sm:flex-col sm:gap-5 sm:p-6 sm:text-center">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-brand-soft sm:size-32 sm:rounded-2xl lg:size-40">
                  <Image src={photo} alt="" fill sizes="(min-width: 1024px) 160px, (min-width: 640px) 128px, 80px" className="object-cover" />
                </div>
                <div className="min-w-0 wrap-anywhere">
                  <h3 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">{nickname}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-copy sm:text-base">{specialty}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
