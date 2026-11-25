export type AnalyticsChoice = 'accepted' | 'rejected'
const storageKey = 'common-stride:analytics-consent:v1'
const changeEvent = 'common-stride:analytics-consent-change'
const maxAge = 180 * 24 * 60 * 60 * 1000
let memoryChoice: { choice: AnalyticsChoice; expires: number } | null = null

export function readAnalyticsChoice(): AnalyticsChoice | null {
  let stored: unknown = memoryChoice
  if (!stored) {
    let serialized: string | null
    try { serialized = localStorage.getItem(storageKey) } catch { return null }
    try { stored = JSON.parse(serialized ?? 'null') } catch { return null }
  }
  if (stored && typeof stored === 'object' && 'choice' in stored && 'expires' in stored
    && (stored.choice === 'accepted' || stored.choice === 'rejected')
    && typeof stored.expires === 'number' && stored.expires > Date.now()) return stored.choice
  return null
}

export function saveAnalyticsChoice(choice: AnalyticsChoice) {
  memoryChoice = { choice, expires: Date.now() + maxAge }
  try { localStorage.setItem(storageKey, JSON.stringify(memoryChoice)) } catch { /* Use this tab's memory. */ }
  window.dispatchEvent(new Event(changeEvent))
}

export function subscribeToAnalyticsChoice(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== null && event.key !== storageKey) return
    memoryChoice = null
    onChange()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(changeEvent, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(changeEvent, onChange)
  }
}
