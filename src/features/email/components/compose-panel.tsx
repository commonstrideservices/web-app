'use client'

import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Pencil, Reply } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminFeedback } from '@/features/admin/components/admin-status'
import { cn } from '@/lib/utils'
import type { ComposeLibrary, ComposeReply } from '../model'
import { ComposeEmail } from './compose'
import { composeCacheKey } from './compose-cache'

type Mailbox = { id: string; address: string }
type Draft = { id: string; mailbox: Mailbox; reply?: ComposeReply; attempted?: boolean }
type ComposerState = { drafts: Draft[]; activeId: string | null }

const ComposeContext = createContext<{
  panelId: string
  open: (target: ComposeReply | undefined, trigger: HTMLButtonElement) => void
} | null>(null)
const subscribeToHydration = () => () => {}

function draftFor(mailbox: Mailbox, reply?: ComposeReply): Draft {
  const id = reply
    ? JSON.stringify([mailbox.id, reply.location.folder, reply.location.validity, reply.location.uid])
    : mailbox.id
  return { id, mailbox, reply }
}

export function ComposePanel({ staffId, mailbox, library, initialOpen, initialReply, onDelivered, onDraftSaved, children }: {
  staffId: string
  mailbox: Mailbox | null
  library: Promise<ComposeLibrary | null>
  initialOpen: boolean
  initialReply?: ComposeReply
  onDelivered: (mailboxId: string) => void
  onDraftSaved: (mailboxId: string, folder: string) => void
  children: ReactNode
}) {
  const panelId = useId()
  const titleId = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false)
  const [fullscreenId, setFullscreenId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<ComposeLibrary | null>()
  const [sentNotice, setSentNotice] = useState<{ message: string } | null>(null)
  const [state, setState] = useState<ComposerState>(() => {
    const draft = mailbox && initialOpen ? draftFor(mailbox, initialReply) : null
    return { drafts: draft ? [draft] : [], activeId: draft?.id ?? null }
  })
  const fullscreen = state.activeId !== null && state.activeId === fullscreenId

  useEffect(() => {
    let current = true
    void library.then((result) => {
      if (current) setTemplates(result)
    }, () => {
      if (current) setTemplates(null)
    })
    return () => { current = false }
  }, [library])

  useEffect(() => {
    if (!sentNotice) return
    const timer = window.setTimeout(() => setSentNotice(null), 5000)
    return () => window.clearTimeout(timer)
  }, [sentNotice])

  useLayoutEffect(() => {
    const panel = dialog.current
    if (!panel || !hydrated) return
    if (!state.activeId) {
      if (panel.open) {
        const returnFocus = panel.contains(document.activeElement) || document.activeElement === document.body
        panel.close()
        if (returnFocus) opener.current?.focus({ preventScroll: true })
      }
      return
    }

    const desktop = window.matchMedia('(min-width: 40rem)')
    const showPanel = () => {
      const modal = fullscreen || !desktop.matches
      const focused = document.activeElement
      const restoreFocus = focused instanceof HTMLElement
        && panel.querySelector('[data-compose-draft]:not([hidden])')?.contains(focused)
      if (panel.open && panel.matches(':modal') !== modal) panel.close()
      if (!panel.open) {
        if (modal) panel.showModal()
        else panel.show()
      }
      if (restoreFocus) focused.focus({ preventScroll: true })
      else focusComposer(panel, modal)
    }
    showPanel()
    desktop.addEventListener('change', showPanel)
    return () => desktop.removeEventListener('change', showPanel)
  }, [state.activeId, fullscreen, hydrated])

  function open(reply: ComposeReply | undefined, trigger: HTMLButtonElement) {
    if (!mailbox) return
    const draft = draftFor(mailbox, reply)
    opener.current = trigger
    if (state.activeId === draft.id && dialog.current) {
      focusComposer(dialog.current, dialog.current.matches(':modal'))
      return
    }
    setFullscreenId(null)
    setState((current) => ({
      activeId: draft.id,
      drafts: current.drafts.some(({ id }) => id === draft.id) ? current.drafts : [...current.drafts, draft],
    }))
  }

  function close() {
    setFullscreenId(null)
    setState(({ activeId, drafts }) => ({
      activeId: null,
      drafts: drafts.filter(({ id, attempted }) => id !== activeId || !attempted),
    }))
  }

  function discard(id: string) {
    setFullscreenId((current) => current === id ? null : current)
    setState(({ activeId, drafts }) => ({
      activeId: activeId === id ? null : activeId,
      drafts: drafts.filter((draft) => draft.id !== id),
    }))
  }

  function recordAttempt(id: string) {
    setState(({ activeId, drafts }) => ({
      activeId,
      drafts: activeId === id
        ? drafts.map((draft) => draft.id === id ? { ...draft, attempted: true } : draft)
        : drafts.filter((draft) => draft.id !== id),
    }))
  }

  function dismiss() {
    if (fullscreen) setFullscreenId(null)
    else close()
  }

  return <ComposeContext.Provider value={{ panelId, open }}>
    {children}
    <dialog id={panelId} ref={dialog} aria-labelledby={titleId}
      className={cn('fixed inset-0 z-40 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain bg-card p-0 text-card-foreground backdrop:bg-black/30',
        !fullscreen && 'sm:inset-auto sm:right-4 sm:bottom-0 sm:h-auto sm:max-h-[calc(100dvh-1rem)] sm:w-fit sm:rounded-t-xl sm:border sm:shadow-xl')}
      onCancel={(event) => { event.preventDefault(); dismiss() }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          dismiss()
        }
      }}>
      {hydrated && state.drafts.map((draft) => <div key={draft.id} data-compose-draft hidden={draft.id !== state.activeId}
        className={fullscreen && draft.id === state.activeId ? 'h-full' : undefined}>
        <ComposeEmail mailbox={draft.mailbox} reply={draft.reply} library={templates}
          cacheKey={composeCacheKey(staffId, draft.id)}
          titleId={draft.id === state.activeId ? titleId : undefined}
          fullscreen={fullscreen && draft.id === state.activeId}
          onFullscreenChange={(expanded) => setFullscreenId((current) => expanded ? draft.id : current === draft.id ? null : current)}
          onClose={close} onDiscard={() => discard(draft.id)} onAttempt={() => recordAttempt(draft.id)}
          onDraftSaved={(folder) => onDraftSaved(draft.mailbox.id, folder)}
          onSent={(message) => {
            discard(draft.id)
            setSentNotice({ message })
            onDelivered(draft.mailbox.id)
          }} />
      </div>)}
    </dialog>
    {sentNotice && <AdminFeedback tone="success" className="pointer-events-none fixed start-4 bottom-4 z-50 shadow-lg">
      {sentNotice.message}
    </AdminFeedback>}
  </ComposeContext.Provider>
}

function focusComposer(panel: HTMLDialogElement, modal: boolean) {
  const draft = panel.querySelector('[data-compose-draft]:not([hidden])')
  const control = draft?.querySelector<HTMLElement>(modal
    ? '[data-compose-close]'
    : '[data-compose-focus]')
  control?.focus({ preventScroll: true })
}

export function ComposeTrigger({ reply, className }: { reply?: ComposeReply; className?: string }) {
  const panel = useContext(ComposeContext)
  const Icon = reply ? Reply : Pencil
  return <Button type="button" className={className} size={reply ? 'sm' : 'default'} variant={reply ? 'outline' : 'default'}
    aria-haspopup="dialog" aria-controls={panel?.panelId}
    onClick={(event) => panel?.open(reply, event.currentTarget)}>
    <Icon aria-hidden="true" /> {reply ? 'Reply' : 'Compose'}
  </Button>
}
