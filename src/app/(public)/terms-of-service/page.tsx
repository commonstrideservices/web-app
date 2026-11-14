import Link from 'next/link'
import { publicPageMetadata } from '@/features/site/metadata'

export const metadata = publicPageMetadata({
  path: '/terms-of-service',
  title: 'Terms of Service',
  description: 'Read Common Stride’s terms for using this website, submitting a service inquiry, and arranging paid work.',
})

const headingClass = 'mb-3 font-heading text-2xl leading-tight font-bold tracking-[-0.04em] text-ink sm:text-3xl'
const linkClass = 'font-semibold text-ink underline decoration-brand underline-offset-4 hover:decoration-2'

export default function TermsOfServicePage() {
  return (
    <article className="site-shell py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="rounded-2xl border border-rule bg-paper p-6 sm:p-9">
          <h1 className="font-heading text-4xl leading-tight font-extrabold tracking-[-0.055em] sm:text-6xl">Terms of Service</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-copy sm:text-lg">
            These terms apply to the Common Stride website and its inquiry form. Common Stride is based in the Philippines and works with clients worldwide. Paid work is governed by the agreement you and Common Stride accept for that engagement.
          </p>
        </header>

        <div className="mt-8 divide-y divide-rule text-base leading-relaxed text-copy sm:mt-10 [&>section]:py-6 [&>section]:first:pt-0 [&>section]:last:pb-0">
          <section>
            <h2 className={headingClass}>Inquiries and paid work</h2>
            <p>
              The website describes our services and lets you tell us what you need. Submitting an inquiry is free and creates no obligation to buy or provide services. An inquiry confirmation means we received your request.
            </p>
            <p className="mt-3">
              Before paid work begins, we agree with you in writing on the scope, deliverables, fees and currency, payment schedule, and timeline. The agreement also sets out any applicable terms for changes, cancellation, refunds, ownership, confidentiality, and ongoing support. If these website terms conflict with that agreement about the paid work, the agreement governs that work, subject to applicable law.
            </p>
          </section>

          <section>
            <h2 className={headingClass}>Using the website and inquiry form</h2>
            <ul className="list-disc space-y-2 pl-5 marker:text-brand">
              <li>Use the site lawfully and provide accurate contact and project information. If you inquire for someone else, make sure you have permission to act on their behalf.</li>
              <li>Share only information you have permission to provide. Keep passwords, payment card details, patient records, and other sensitive information out of the public form.</li>
              <li>Do not send spam or malicious content, impersonate others, access restricted areas without authorization, or disrupt the website.</li>
            </ul>
            <p className="mt-3">We may limit requests or restrict access to protect the site and its users or respond to misuse.</p>
          </section>

          <section>
            <h2 className={headingClass}>Website content and materials you share</h2>
            <p>
              Common Stride and its licensors retain their rights in the site’s content, branding, and images. You may browse the site and share links to it. Ask permission before republishing or commercially reusing protected materials unless the law or a relevant license already permits that use.
            </p>
            <p className="mt-3">
              Submitting an inquiry does not transfer ownership of your materials. We may review the information you share to respond to your request and discuss the work. Rights to project materials and deliverables are addressed in the agreement for that work.
            </p>
          </section>

          <section>
            <h2 className={headingClass}>Website information and availability</h2>
            <p>
              Service descriptions and examples are general information. Availability, timing, and project details may vary by engagement. We may update the website, and it may be temporarily unavailable during maintenance or outages. External websites have their own terms and privacy practices.
            </p>
          </section>

          <section>
            <h2 className={headingClass}>Privacy and your rights</h2>
            <p>
              Our <Link href="/privacy-policy" className={linkClass}>Privacy Policy</Link> explains how we handle personal information. Philippine law applies to these website terms to the extent permitted by applicable law. These terms preserve any consumer rights and remedies that cannot be waived under the laws that apply to you.
            </p>
          </section>

          <section>
            <h2 className={headingClass}>Updates and questions</h2>
            <p>
              We’ll post any updates to these terms on this page. For questions about the website or these terms, contact <a href="mailto:info@commonstrideservice.com" className={`${linkClass} wrap-anywhere`}>info@commonstrideservice.com</a>.
            </p>
          </section>
        </div>
      </div>
    </article>
  )
}
