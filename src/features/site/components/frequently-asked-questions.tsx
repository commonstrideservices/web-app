import { ChevronDown } from 'lucide-react'
import { Reveal } from './site-motion'

const questions = [
  {
    question: 'What time zones do you cover?',
    intro: 'We cover US, UK, Australian, and other international business hours, depending on where you’re based.',
    points: [
      { label: 'US (Eastern to Pacific)', text: 'Full overlap with your business day, including early morning and evening coverage.' },
      { label: 'UK and Europe', text: 'Morning to afternoon overlap, with flexible shifts available.' },
      { label: 'Australia and Asia-Pacific', text: 'Same-day overlap with your business hours.' },
    ],
    closing: 'We agree on your assistant’s working hours during onboarding. We can also arrange split shifts or overnight work so tasks are ready when you start your day.',
  },
  {
    question: 'How do you keep my information confidential?',
    intro: 'Every Common Stride team member signs a confidentiality agreement before working on a client account. We’re happy to sign your NDA as well.',
    points: [
      { label: 'Limited access', text: 'Only the people assigned to your account can access your data.' },
      { label: 'Your tools, your control', text: 'We work in your email, CRM, and file storage using accounts you create and can remove at any time.' },
      { label: 'Secure password sharing', text: 'We share passwords through a password manager and keep them out of email and chat.' },
      { label: 'End of engagement', text: 'We return or delete your files and hand back access.' },
    ],
  },
  {
    question: 'Do I have to sign a long-term contract?',
    intro: 'You can choose a month-to-month plan or a longer engagement at a preferred rate.',
    points: [
      { label: 'Notice period', text: 'Either side can end the agreement with 30 days’ written notice.' },
      { label: 'Room to grow', text: 'If you need more hours, services, or team members, we’ll update your agreement.' },
    ],
    closing: 'You’ll see the terms in writing before any work starts.',
  },
  {
    question: 'How long does onboarding take?',
    intro: 'Most clients are up and running within 3 to 7 business days of signing.',
    ordered: true,
    points: [
      { label: 'Discovery call (Day 1)', text: 'We learn about your business, goals, tools, and priorities.' },
      { label: 'Assistant match (Days 2–3)', text: 'We match you with someone whose skills fit your needs, from real estate and executive support to e-commerce.' },
      { label: 'Setup (Days 3–5)', text: 'We get access to your tools and agree on working hours, communication channels, and reporting.' },
      { label: 'Start work (Days 5–7)', text: 'Your assistant begins, and we check in during the first two weeks to fine-tune the setup.' },
    ],
    closing: 'If you need someone sooner, tell us. We can often speed up a simple setup.',
  },
  {
    question: 'What happens if my assistant leaves?',
    intro: 'If your assistant leaves Common Stride or needs extended time off, we provide a replacement at no extra cost.',
    points: [
      { label: 'Backup coverage', text: 'We arrange coverage for illness and leave to keep your work moving.' },
      { label: 'Documented handover', text: 'We keep process notes and task guides so the next assistant can pick up where the previous one left off.' },
      { label: 'A different match', text: 'You can ask for a different assistant at any time, for any reason.' },
    ],
  },
]

export function FrequentlyAskedQuestions() {
  return (
    <section id="faq" className="scroll-mt-8 bg-white" aria-labelledby="faq-heading">
      <div className="site-shell grid gap-8 py-16 sm:py-23 lg:grid-cols-[1fr_2fr] lg:gap-12">
        <Reveal>
          <h2 id="faq-heading" className="font-heading text-4xl font-extrabold tracking-[-0.06em] sm:text-6xl lg:max-w-[12ch]">
            Frequently asked questions
          </h2>
        </Reveal>

        <Reveal className="min-w-0 divide-y divide-rule rounded-2xl border border-rule" delay={0.06}>
          {questions.map(({ question, intro, points, ordered, closing }) => {
            const List = ordered ? 'ol' : 'ul'

            return (
              <details key={question} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-base leading-snug font-semibold text-ink focus-visible:rounded-xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:px-6 sm:text-lg [&::-webkit-details-marker]:hidden">
                  {question}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-ink">
                    <ChevronDown size={17} aria-hidden="true" className="group-open:rotate-180 motion-safe:transition-transform" />
                  </span>
                </summary>
                <div className="space-y-3 px-4 pb-5 text-sm leading-relaxed text-copy sm:px-6 sm:pb-6 sm:text-base">
                  <p>{intro}</p>
                  <List className={`space-y-2 pl-5 ${ordered ? 'list-decimal' : 'list-disc'}`}>
                    {points.map(({ label, text }) => (
                      <li key={label}><strong className="font-semibold text-ink">{label}.</strong> {text}</li>
                    ))}
                  </List>
                  {closing && <p>{closing}</p>}
                </div>
              </details>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}
