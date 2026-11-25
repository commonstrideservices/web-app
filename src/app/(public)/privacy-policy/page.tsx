import { publicPageMetadata } from '@/features/site/metadata'

export const metadata = publicPageMetadata({
  path: '/privacy-policy',
  title: 'Privacy Policy',
  description: 'Learn how Common Stride handles personal information for website inquiries and client services, and how to exercise your privacy rights.',
})

const privacyEmail = 'info@commonstrideservice.com'
const headingClass = 'mb-3 font-heading text-2xl leading-tight font-bold tracking-[-0.04em] text-ink sm:text-3xl'
const linkClass = 'font-semibold text-ink underline decoration-brand underline-offset-4 hover:decoration-2'

export default function PrivacyPolicyPage() {
  return (
    <article className="site-shell py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="rounded-2xl border border-rule bg-paper p-6 sm:p-9">
          <h1 className="font-heading text-4xl leading-tight font-extrabold tracking-[-0.055em] sm:text-6xl">Privacy Policy</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-copy sm:text-lg">
            Common Stride is based in the Philippines and works with clients worldwide. This policy explains how we handle personal information when you visit our website, contact us, or work with us.
          </p>
        </header>

        <div className="mt-8 divide-y divide-rule text-base leading-relaxed text-copy sm:mt-10 [&>section]:py-6 [&>section]:first:pt-0 [&>section]:last:pb-0">
          <section>
            <h2 className={headingClass}>Information we collect</h2>
            <ul className="list-disc space-y-2 pl-5 marker:text-brand">
              <li><strong className="text-ink">Inquiries.</strong> We collect your name, company name, phone number, email address, and questionnaire answers, including your industry, the services you’re interested in, project details, timing, and budget. We may keep related correspondence and follow-up notes.</li>
              <li><strong className="text-ink">Client engagements.</strong> If you hire us, we may collect business contact details, project materials, and billing records as needed for the work we agree to do.</li>
              <li><strong className="text-ink">Website and security information.</strong> Our hosting provider may process request information such as IP addresses and timestamps. To limit spam and abuse, the site stores request counts using coded identifiers derived from the submitted email address and, when available, the network address.</li>
            </ul>
            <p className="mt-3">Please leave passwords, payment card details, patient records, and other sensitive information out of the public inquiry form.</p>
          </section>

          <section>
            <h2 className={headingClass}>How and why we use information</h2>
            <p>
              We use inquiry information to understand your needs, respond, follow up, and prepare a proposal when requested. We use client information to deliver and support agreed services, communicate with you, and manage billing. Our team reviews inquiries. Automated limits help prevent spam and excessive submissions.
            </p>
            <p className="mt-3">
              Under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173), we rely on the applicable basis for each use. This includes taking steps you request before a contract or performing an agreement with you, our legitimate interests in responding to business contacts and securing the site where those interests do not override your rights, and meeting legal obligations. We ask for consent when the law requires it.
            </p>
          </section>

          <section>
            <h2 className={headingClass}>Browser storage and cookies</h2>
            <p>
              The inquiry form saves your progress and answers in your browser so you can resume later. The final contact fields are kept separately from this draft. The site clears the draft after a successful submission, and you can clear it yourself by deleting this site’s data in your browser settings. The staff area uses cookies for sign-in and to remember the display theme.
            </p>
            <p className="mt-3">
              With your permission, we use Google Analytics to understand public page visits and successful inquiry submissions. Google may process cookie identifiers and information about your browser, device, and site use. Our analytics events do not include your contact details or questionnaire answers, and we remove URL query strings and fragments from the page addresses we send. We do not enable advertising personalization or Google signals.
            </p>
            <p className="mt-3">
              Analytics stays off until you accept it. You can reject analytics or change your choice using Analytics settings in the footer. We remember your choice in this browser for up to six months. Rejecting analytics stops future collection and removes this site’s Google Analytics cookies; it does not delete data already collected. Google processes analytics information under its <a href="https://policies.google.com/privacy" className={linkClass}>Privacy Policy</a> and may process it outside your country.
            </p>
          </section>

          <section>
            <h2 className={headingClass}>Who can access your information</h2>
            <p>
              Authorized staff can access information they need to respond to you or deliver the work. We use Vercel to host the site and Supabase to store inquiry records. Depending on the engagement, providers that support communications, billing, or project delivery may process information needed for those services. We may also disclose information when legally required or to establish, exercise, or defend a legal claim.
            </p>
            <p className="mt-3">
              The website uses HTTPS to protect information in transit. Staff must sign in to view or manage submitted inquiries.
            </p>
          </section>

          <section>
            <h2 className={headingClass}>Data we handle for clients</h2>
            <p>
              For services such as virtual assistance, lead research, CRM support, and custom software, we may handle personal information on a client’s behalf. For example, the work may involve client-supplied records or professional contact details from publicly available sources. When a client decides why and how that information is used and we process it for them, we act on their instructions under our agreement. You can contact that client about information they control, and we can help direct your request if you reach us first.
            </p>
          </section>

          <section>
            <h2 className={headingClass}>International processing</h2>
            <p>
              Our team in the Philippines may access information from clients in other countries. Our providers may store or process it outside the Philippines and outside your country. We remain responsible for personal information under our control and use appropriate safeguards for international transfers as required by applicable law.
            </p>
          </section>

          <section>
            <h2 className={headingClass}>How long we keep information</h2>
            <p>
              We keep inquiry records for as long as needed to respond, follow up, and resolve the inquiry. For active clients, we keep records as needed to deliver and support the work and manage the relationship. We may retain records longer if required by law or needed to resolve a dispute or defend a legal claim. Once the reason for keeping information ends, we delete or anonymize it.
            </p>
          </section>

          <section>
            <h2 className={headingClass}>Your rights and how to contact us</h2>
            <p>
              Under applicable law, you can ask what personal information we hold about you, request a copy, correct inaccuracies, object to certain uses, or ask us to block or delete information. You may also withdraw consent where we rely on it, request a portable copy where applicable, or seek compensation as provided by law.
            </p>
            <p className="mt-3">
              Common Stride is responsible for personal information it collects for its own website and business purposes. For privacy questions or requests, email us at <a className={`${linkClass} wrap-anywhere`} href={`mailto:${privacyEmail}`}>{privacyEmail}</a>. We may verify your identity before acting on a request.
            </p>
            <p className="mt-3">
              You can file a complaint with the <a className={linkClass} href="https://privacy.gov.ph/file-a-complaint-2/">Philippine National Privacy Commission</a>. You may also have rights under the laws that apply where you live.
            </p>
          </section>
        </div>
      </div>
    </article>
  )
}
