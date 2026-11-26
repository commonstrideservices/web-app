'use client'

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { AnalyticsTracker } from '../tracker'
import { readAnalyticsChoice, saveAnalyticsChoice, subscribeToAnalyticsChoice, type AnalyticsChoice } from '../consent-store'

const AnalyticsContext = createContext({ enabled: false, openSettings: () => {}, trackLead: () => {} })

export function AnalyticsProvider({ configuration, publicPaths, previewConsent = false, children }: {
  configuration: { measurementId: string; origin: string } | null
  publicPaths: string[]
  previewConsent?: boolean
  children: React.ReactNode
}) {
  const [tracker] = useState(() => !previewConsent && configuration
    ? new AnalyticsTracker(configuration.measurementId, configuration.origin, publicPaths) : null)
  const choice = useSyncExternalStore(subscribeToAnalyticsChoice, readAnalyticsChoice, () => null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const pathname = usePathname()
  const allowedHost = useSyncExternalStore(subscribeToAnalyticsChoice,
    () => Boolean(configuration && window.location.origin === configuration.origin), () => false)
  const enabled = previewConsent || Boolean(configuration && allowedHost)
  const accepted = enabled && choice === 'accepted'

  useEffect(() => {
    if (accepted) tracker?.start()
    else tracker?.stop()
    return () => tracker?.stop()
  }, [accepted, tracker])

  useEffect(() => {
    if (accepted) tracker?.pageView(pathname)
  }, [accepted, pathname, tracker])

  const trackLead = useCallback(() => { tracker?.lead() }, [tracker])

  function choose(next: AnalyticsChoice) {
    // Disable immediately so no event can race with the React update.
    if (next === 'rejected') tracker?.stop()
    saveAnalyticsChoice(next)
    setSettingsOpen(false)
  }

  return (
    <AnalyticsContext.Provider value={{ enabled, openSettings: () => setSettingsOpen(true), trackLead }}>
      {children}
      {accepted && !previewConsent && configuration && <Script id="common-stride-google-analytics"
        src={`https://www.googletagmanager.com/gtag/js?id=${configuration.measurementId}`}
        strategy="afterInteractive" />}
      {enabled && (choice === null || settingsOpen) && (
        <section aria-label="Analytics preferences" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-rule bg-white p-5 text-ink shadow-xl sm:inset-x-6 sm:bottom-6 sm:p-6">
          <h2 className="font-heading text-xl font-bold">Your analytics choice</h2>
          <p className="mt-2 text-sm leading-relaxed text-copy">
            With your permission, we use Google Analytics cookies to understand page visits and successful inquiries.
            We do not send your contact details or questionnaire answers. You can change your choice anytime using Analytics settings in the footer.{' '}
            <Link href="/privacy-policy" className="font-semibold text-ink underline decoration-brand underline-offset-4">Privacy Policy</Link>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => choose('rejected')}
              className="min-h-12 rounded-full border border-rule px-3 py-2 text-sm font-semibold hover:border-brand">Reject analytics</button>
            <button type="button" onClick={() => choose('accepted')}
              className="min-h-12 rounded-full border border-brand bg-brand-soft px-3 py-2 text-sm font-semibold hover:bg-paper">Accept analytics</button>
          </div>
          {settingsOpen && choice !== null && <button type="button" onClick={() => setSettingsOpen(false)}
            className="mt-3 min-h-11 rounded-md px-3 text-sm font-semibold underline underline-offset-4">Close settings</button>}
        </section>
      )}
    </AnalyticsContext.Provider>
  )
}

export function AnalyticsSettingsButton() {
  const { enabled, openSettings } = useContext(AnalyticsContext)
  if (!enabled) return null
  return <button type="button" onClick={openSettings} className="inline-flex min-h-11 items-center rounded-md hover:text-ink hover:underline">Analytics settings</button>
}

export function useInquiryAnalytics() {
  return useContext(AnalyticsContext).trackLead
}
