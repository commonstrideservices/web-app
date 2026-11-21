'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { mailDataHref, mailboxView, type MailboxView } from '../model'
import type { MailCache } from './mail-resource'

// Start with folders most likely to be used during a normal correspondence session.
const priority = [
  { specialUse: '\\sent', names: ['sent', 'sent mail', 'sent items', 'sent messages'] },
  { specialUse: '\\drafts', names: ['drafts', 'draft'] },
  { specialUse: '\\archive', names: ['archive', 'archives'] },
  { specialUse: '\\junk', names: ['junk', 'spam', 'junk email', 'junk e-mail'] },
  { specialUse: '\\trash', names: ['trash', 'bin', 'deleted items', 'deleted messages'] },
]

function warmupPaths(folders: MailboxView['folders']) {
  const paths = new Set<string>()
  for (const { specialUse, names } of priority) {
    const folder = folders.find((item) => item.specialUse?.toLowerCase() === specialUse) ??
      folders.find((item) => !item.specialUse && names.includes(item.name.trim().toLowerCase()))
    if (folder && folder.path !== 'INBOX') paths.add(folder.path)
  }
  return paths
}

export function useFolderWarmup(mailboxId: string | undefined, cache: MailCache<MailboxView>) {
  const inboxKey = mailboxId ? mailDataHref(mailboxId, 'INBOX') : ''
  const hasInbox = useSyncExternalStore(cache.subscribe, () => Boolean(cache.get(inboxKey)), () => false)
  const attempted = useRef(new Set<string>())

  useEffect(() => {
    if (!mailboxId || !hasInbox) return
    const inbox = cache.get(inboxKey)
    if (!inbox || inbox.folder.path !== 'INBOX') return
    const controller = new AbortController()

    async function warmFolders(id: string, paths: Set<string>) {
      for (const path of paths) {
        if (controller.signal.aborted) return
        const key = mailDataHref(id, path)
        if (attempted.current.has(key)) continue
        if (!cache.get(key)) {
          try {
            await cache.load(key, mailboxView, controller.signal)
          } catch {
            // An explicit visit can retry a failed preload and show the error if it persists.
          }
        }
        if (!controller.signal.aborted) attempted.current.add(key)
      }
    }

    void warmFolders(mailboxId, warmupPaths(inbox.folders))
    return () => controller.abort()
  }, [cache, hasInbox, inboxKey, mailboxId])
}
