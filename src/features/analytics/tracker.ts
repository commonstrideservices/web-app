export function analyticsConfiguration(settings: {
  nodeEnv?: string; deploymentEnv?: string; origin: string; measurementId: string; enabled?: string
}): { measurementId: string; origin: string } | null {
  const { nodeEnv, deploymentEnv, origin, measurementId, enabled } = settings
  if (nodeEnv !== 'production' || (deploymentEnv && deploymentEnv !== 'production')
    || enabled === 'false' || !/^G-[A-Z0-9]+$/.test(measurementId)) return null
  try {
    const url = new URL(origin)
    if (url.protocol !== 'https:' || url.hostname === 'localhost' || url.hostname.endsWith('.localhost')
      || url.hostname === '127.0.0.1' || url.hostname === '[::1]') return null
    return { measurementId, origin: url.origin }
  } catch {
    return null
  }
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    [key: `ga-disable-${string}`]: boolean | undefined
  }
}

const deniedConsent = {
  analytics_storage: 'denied', ad_storage: 'denied',
  ad_user_data: 'denied', ad_personalization: 'denied',
}

/** Owns consent and the two events this site sends. It never accepts form data. */
export class AnalyticsTracker {
  private active = false
  private configured = false
  private lastPath: string | null = null
  private measurementId: string
  private origin: string
  private publicPaths: Set<string>

  constructor(measurementId: string, origin: string, publicPaths: string[]) {
    this.measurementId = measurementId
    this.origin = origin
    this.publicPaths = new Set(publicPaths)
  }

  private canTrack(pathname = window.location.pathname): boolean {
    return window.location.origin === this.origin && this.publicPaths.has(pathname)
      && pathname === window.location.pathname
  }

  private pageParameters() {
    let referrer = ''
    try {
      // Preserve only the referring origin; paths, queries and fragments may contain personal data.
      if (document.referrer) referrer = `${new URL(document.referrer).origin}/`
    } catch { /* An invalid referrer is omitted. */ }
    return { page_location: `${this.origin}${window.location.pathname}`, page_referrer: referrer }
  }

  start(): boolean {
    if (!this.canTrack()) return false
    window.dataLayer ??= []
    // Google's command queue uses Arguments objects, as in the official gtag snippet.
    // eslint-disable-next-line prefer-rest-params
    window.gtag ??= function () { window.dataLayer?.push(arguments) }
    window[`ga-disable-${this.measurementId}`] = false
    if (!this.configured) {
      window.gtag('consent', 'default', deniedConsent)
      window.gtag('js', new Date())
    }
    window.gtag('consent', 'update', { ...deniedConsent, analytics_storage: 'granted' })
    if (!this.configured) {
      window.gtag('config', this.measurementId, {
        ...this.pageParameters(), send_page_view: false,
        allow_google_signals: false, allow_ad_personalization_signals: false,
      })
      this.configured = true
    }
    this.active = true
    return true
  }

  pageView(pathname: string): void {
    if (!this.active || !this.canTrack(pathname) || pathname === this.lastPath) return
    this.lastPath = pathname
    // Set context as well as event parameters for any automatic GA session events.
    window.gtag?.('set', this.pageParameters())
    window.gtag?.('event', 'page_view', {
      ...this.pageParameters(), page_title: pathname === '/' ? 'Common Stride' : `Common Stride ${pathname}`,
      send_to: this.measurementId,
    })
  }

  lead(): void {
    if (!this.active || !this.canTrack() || window.location.pathname !== '/connect') return
    window.gtag?.('event', 'generate_lead', { ...this.pageParameters(), send_to: this.measurementId })
  }

  stop(): void {
    if (!this.configured) return
    this.active = false
    this.lastPath = null
    window[`ga-disable-${this.measurementId}`] = true
    window.gtag?.('consent', 'update', deniedConsent)
    const hostParts = window.location.hostname.split('.')
    const domains = ['', ...hostParts.slice(0, -1).map((_, index) => `; Domain=.${hostParts.slice(index).join('.')}`)]
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.trim().split('=')[0]
      if (name !== '_ga' && !name.startsWith('_ga_')) continue
      for (const domain of domains) {
        document.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax; Secure`
      }
    }
  }
}
