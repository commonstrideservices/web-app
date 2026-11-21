'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import type { z } from 'zod'

type Entry<T> = { data: T; loadedAt: number }
type PendingRequest = { controller: AbortController; promise: Promise<void>; users: number }

class MailRequestError extends Error {
  constructor(message: string, readonly missing: boolean) {
    super(message)
  }
}

export class MailCache<T> {
  private readonly entries = new Map<string, Entry<T>>()
  private readonly pending = new Map<string, PendingRequest>()
  private readonly listeners = new Set<() => void>()

  constructor(private readonly capacity: number, initial?: { key: string; data: T }) {
    if (initial) this.entries.set(initial.key, { data: initial.data, loadedAt: Date.now() })
  }

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  get(key: string) {
    return this.entries.get(key)?.data
  }

  latest(prefix: string) {
    let latest: Entry<T> | undefined
    for (const [key, entry] of this.entries) {
      if (key.startsWith(prefix) && (!latest || entry.loadedAt >= latest.loadedAt)) latest = entry
    }
    return latest?.data
  }

  touchIfFresh(key: string, maxAge: number) {
    const entry = this.entries.get(key)
    if (!entry || Date.now() - entry.loadedAt >= maxAge) return false
    this.entries.delete(key)
    this.entries.set(key, entry)
    return true
  }

  set(key: string, data: T) {
    this.entries.delete(key)
    this.entries.set(key, { data, loadedAt: Date.now() })
    const oldest = this.entries.keys().next().value
    if (this.entries.size > this.capacity && oldest !== undefined) this.entries.delete(oldest)
    this.notify()
  }

  expire(key: string) {
    const entry = this.entries.get(key)
    if (entry) entry.loadedAt = 0
  }

  async load(key: string, schema: z.ZodType<T>, signal: AbortSignal) {
    signal.throwIfAborted()
    let request = this.pending.get(key)
    if (!request) {
      const controller = new AbortController()
      const promise = this.fetch(key, schema, controller.signal).finally(() => {
        if (this.pending.get(key)?.controller === controller) this.pending.delete(key)
      })
      request = { controller, promise, users: 0 }
      this.pending.set(key, request)
    }

    const shared = request
    shared.users += 1
    const release = () => {
      shared.users -= 1
      if (shared.users === 0 && this.pending.get(key) === shared) {
        this.pending.delete(key)
        shared.controller.abort()
      }
    }

    signal.addEventListener('abort', release, { once: true })
    try {
      await shared.promise
    } finally {
      signal.removeEventListener('abort', release)
      if (!signal.aborted) release()
    }
  }

  private async fetch(key: string, schema: z.ZodType<T>, signal: AbortSignal) {
    const response = await fetch(key, { cache: 'no-store', signal })
    const value: unknown = await response.json()
    signal.throwIfAborted()
    if (!response.ok) {
      const message = value && typeof value === 'object' && 'error' in value && typeof value.error === 'string'
        ? value.error : 'Email could not be loaded. Try again.'
      throw new MailRequestError(message, response.status === 404)
    }
    this.set(key, schema.parse(value))
  }

  clear() {
    for (const { controller } of this.pending.values()) controller.abort()
    this.pending.clear()
    this.entries.clear()
    this.notify()
  }

  private notify() {
    for (const listener of this.listeners) listener()
  }
}

export function useCachedMail<T>(cache: MailCache<T>, key: string, schema: z.ZodType<T>, maxAge: number) {
  const data = useSyncExternalStore(cache.subscribe, () => cache.get(key), () => cache.get(key))
  const [attempt, setAttempt] = useState(0)
  const [failure, setFailure] = useState<{ attempt: number; message: string; missing: boolean } | null>(null)

  useEffect(() => {
    if (cache.touchIfFresh(key, maxAge)) return
    const controller = new AbortController()
    void cache.load(key, schema, controller.signal).catch((error: unknown) => {
      if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return
      setFailure(error instanceof MailRequestError
        ? { attempt, message: error.message, missing: error.missing }
        : { attempt, message: 'Email could not be loaded. Try again.', missing: false })
    })
    return () => controller.abort()
  }, [cache, key, schema, maxAge, attempt])

  return {
    data,
    failure: failure?.attempt === attempt ? failure : null,
    retry() {
      cache.expire(key)
      setAttempt((value) => value + 1)
    },
  }
}
