'use client'

import { useState, useSyncExternalStore, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight, Folder, Inbox, MailOpen, Paperclip, Send, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminFeedback } from '@/features/admin/components/admin-status'
import { AdminThemeToggle } from '@/features/admin/components/admin-theme'
import { cn } from '@/lib/utils'
import {
  folderPath, mailDataHref, mailHref, mailMessage, mailboxView, readMailLocation, readMailPage,
  type ComposeLibrary, type ComposeReply, type MailboxView, type MailMessage, type MailMessageSummary,
} from '../model'
import { MailboxSwitcher, RefreshMailbox } from './client-toolbar'
import { ComposePanel, ComposeTrigger } from './compose-panel'
import { useFolderWarmup } from './folder-warmup'
import { MailCache, useCachedMail } from './mail-resource'

const settingsHref = '/admin/configuration/email'
type Mailbox = { id: string; address: string; displayName: string }
type MailReaderProps = { mailbox: Mailbox; folder: string; page: number; timeZone: string }

function navigate(href: string) {
  if (window.location.pathname + window.location.search !== href) window.history.pushState(null, '', href)
}

function mailboxCachePrefix(id: string) {
  return mailDataHref(id, 'INBOX').split('folder=', 1)[0]
}

function MailLink({ href, children, ...props }: Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string }) {
  return <Link {...props} href={href} prefetch={false} onNavigate={(event) => { event.preventDefault(); navigate(href) }}>
    {children}
  </Link>
}

function mailDate(iso: string, timeZone: string, detailed = false) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short', day: 'numeric', ...(detailed ? { year: 'numeric', hour: 'numeric', minute: '2-digit' } : {}), timeZone,
  }).format(new Date(iso))
}

export function MailWorkspace({ staffId, mailboxes, initialMessage, initialCompose, initialReply, library, brand, timeZone }: {
  staffId: string
  mailboxes: Mailbox[]
  initialMessage?: { key: string; data: MailMessage }
  initialCompose: boolean
  initialReply?: ComposeReply
  library: Promise<ComposeLibrary | null>
  brand: ReactNode
  timeZone: string
}) {
  const search = useSearchParams()
  const router = useRouter()
  const mailbox = mailboxes.find((item) => item.id === search.get('mailbox')) ?? mailboxes[0]
  const folder = folderPath.safeParse(search.get('folder')).data ?? 'INBOX'
  const page = readMailPage(search.get('page'))
  const currentFolder = mailbox ? mailDataHref(mailbox.id, folder, page) : ''
  const [folders] = useState(() => new MailCache<MailboxView>(12))
  const [messages] = useState(() => new MailCache<MailMessage>(30, initialMessage))
  const [refreshVersion, setRefreshVersion] = useState(0)
  useFolderWarmup(mailbox?.id, folders)

  function refresh() {
    messages.clear()
    setRefreshVersion((value) => value + 1)
    router.refresh()
  }

  function refreshSavedFolder(id: string, path: string) {
    if (mailbox?.id === id && (folder === path || folders.get(currentFolder)?.folder.path === path)) {
      setRefreshVersion((value) => value + 1)
    }
  }

  function refreshSent(id: string) {
    const activeFolder = folders.get(currentFolder)?.folder
    if (activeFolder && (activeFolder.specialUse === '\\Sent' || /^(sent|sent mail|sent items)$/i.test(activeFolder.name))) {
      refreshSavedFolder(id, activeFolder.path)
    }
  }

  return <ComposePanel staffId={staffId} mailbox={mailbox ?? null} library={library} initialOpen={initialCompose} initialReply={initialReply}
    onDelivered={refreshSent} onDraftSaved={refreshSavedFolder}>
    <div className="flex min-h-dvh min-w-0 flex-col lg:h-dvh lg:overflow-hidden">
      <header className="sticky top-0 z-10 shrink-0 border-b bg-background">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {brand}
            <h1 className="border-s ps-3 font-heading text-lg font-semibold sm:text-xl">Email</h1>
          </div>
          <div className="flex items-center gap-2">
            {mailbox && <RefreshMailbox refresh={refresh} />}
            <div className="hidden sm:block"><AdminThemeToggle /></div>
            <Button asChild variant="ghost" size="icon"><Link href={settingsHref} aria-label="Email settings" title="Email settings">
              <Settings2 aria-hidden="true" />
            </Link></Button>
          </div>
          {mailbox && <div className="order-last min-w-0 basis-full sm:order-none sm:basis-auto">
            <MailboxSwitcher mailboxes={mailboxes.map(({ id, displayName, address }) => ({ id, label: `${displayName} · ${address}` }))}
              selected={mailbox.id} onChange={(id) => navigate(mailHref(id))} />
          </div>}
        </div>
      </header>
      {mailbox ? <FolderWorkspace key={`${currentFolder}:${refreshVersion}`} mailbox={mailbox} folder={folder} page={page}
        folderKey={currentFolder} folders={folders} messages={messages} timeZone={timeZone} /> : <EmptyMailboxes />}
    </div>
  </ComposePanel>
}

function EmptyMailboxes() {
  return <main className="mx-auto w-full max-w-xl p-4 sm:p-8">
    <Card>
      <CardHeader><CardTitle role="heading" aria-level={2}>No enabled mailboxes</CardTitle></CardHeader>
      <CardContent className="grid justify-items-start gap-4 text-sm">
        <AdminFeedback tone="info">Add a Porkbun hosted mailbox to start reading and sending email.</AdminFeedback>
        <Button asChild><Link href={settingsHref}>Open Email settings</Link></Button>
      </CardContent>
    </Card>
  </main>
}

function FolderWorkspace({ mailbox, folder, page, timeZone, folderKey, folders, messages }: MailReaderProps & {
  folderKey: string
  folders: MailCache<MailboxView>
  messages: MailCache<MailMessage>
}) {
  const search = useSearchParams()
  const { data: view, failure, retry } = useCachedMail(folders, folderKey, mailboxView, 0)
  const prefix = mailboxCachePrefix(mailbox.id)
  const lastView = useSyncExternalStore(folders.subscribe, () => folders.latest(prefix), () => folders.latest(prefix))
  const folderList = (view ?? lastView)?.folders
  const activeFolder = view?.folder.path ?? folder
  const location = search.get('mailbox') === mailbox.id ? readMailLocation(search) : null
  const unavailable = Boolean(location && view && (location.folder !== activeFolder || location.validity !== view.validity))
  const summary = unavailable ? undefined : view?.messages.find((item) => item.location.uid === location?.uid)
  const messageKey = location && mailDataHref(mailbox.id, location.folder, 1, location)
  const backHref = mailHref(mailbox.id, activeFolder, view?.page ?? page)

  return <main className="grid min-w-0 flex-1 content-start lg:min-h-0 lg:grid-cols-[11rem_minmax(17rem,0.95fr)_minmax(0,1.4fr)] lg:content-stretch xl:grid-cols-[13rem_minmax(21rem,0.95fr)_minmax(0,1.4fr)]">
    <nav aria-label="Mail folders" className={cn('min-w-0 border-b bg-sidebar p-3 lg:overflow-y-auto lg:border-e lg:border-b-0 lg:p-4', location && 'hidden lg:block')}>
      <ComposeTrigger className="w-full lg:justify-start" />
      {folderList && <ul className="mt-3 flex flex-wrap gap-1 lg:grid">
        {folderList.map((item) => {
          const Icon = item.path === 'INBOX' ? Inbox : item.specialUse === '\\Sent' ? Send : Folder
          return <li key={item.path} className="min-w-0 max-w-full">
            <Button asChild size="sm" variant={activeFolder === item.path ? 'secondary' : 'ghost'}
              className="h-auto min-h-9 max-w-full justify-start whitespace-normal lg:w-full">
              <MailLink href={mailHref(mailbox.id, item.path)} aria-current={activeFolder === item.path ? 'page' : undefined}>
                <Icon aria-hidden="true" />
                <span className="min-w-0 break-all text-start">{item.path === 'INBOX' ? 'Inbox' : item.name}</span>
              </MailLink>
            </Button>
          </li>
        })}
      </ul>}
    </nav>
    <section aria-label="Message list" className={cn('min-w-0 lg:overflow-y-auto lg:border-e', location && 'hidden lg:block')}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="min-w-0 break-words font-heading font-semibold">
          {activeFolder === 'INBOX' ? 'Inbox' : view?.folder.name ?? folderList?.find(({ path }) => path === folder)?.name ?? folder}
        </h2>
        {view && <FolderPages view={view} mailbox={mailbox.id} />}
      </div>
      {failure && <div className="grid justify-items-start gap-2 p-4">
        <AdminFeedback tone={view ? 'warning' : 'error'}>{failure.message}</AdminFeedback>
        <Button variant="outline" size="sm" onClick={retry}>Try again</Button>
      </div>}
      {view ? <MessageList view={view} mailbox={mailbox.id} selected={unavailable ? undefined : location?.uid} timeZone={timeZone} />
        : !failure && <FolderSkeleton />}
    </section>
    {messageKey ? (unavailable
      ? <ReadingPane backHref={backHref} timeZone={timeZone}>
        <AdminFeedback tone="warning">This message is no longer available in the folder.</AdminFeedback>
      </ReadingPane>
      : <MessageReader key={messageKey} messageKey={messageKey} cache={messages}
        backHref={backHref} summary={summary} timeZone={timeZone} />)
      : <section aria-label="Reading pane" className="hidden place-content-center justify-items-center gap-3 p-6 text-muted-foreground lg:grid">
        <MailOpen className="size-8" aria-hidden="true" />
        <p className="text-sm">Select a message to read it.</p>
      </section>}
  </main>
}

function FolderPages({ view, mailbox }: { view: MailboxView; mailbox: string }) {
  if (view.pageCount < 2) return null
  return <nav aria-label="Message pages" className="flex shrink-0 items-center gap-1">
    {view.page > 1 && <Button asChild variant="ghost" size="icon-sm">
      <MailLink href={mailHref(mailbox, view.folder.path, view.page - 1)} aria-label="Newer messages"><ChevronLeft aria-hidden="true" /></MailLink>
    </Button>}
    <span className="text-xs tabular-nums text-muted-foreground">{view.page} / {view.pageCount}</span>
    {view.page < view.pageCount && <Button asChild variant="ghost" size="icon-sm">
      <MailLink href={mailHref(mailbox, view.folder.path, view.page + 1)} aria-label="Older messages"><ChevronRight aria-hidden="true" /></MailLink>
    </Button>}
  </nav>
}

function MessageList({ view, mailbox, selected, timeZone }: {
  view: MailboxView; mailbox: string; selected?: number; timeZone: string
}) {
  if (!view.messages.length) return <p className="p-4 text-sm text-muted-foreground">This folder is empty.</p>
  return <ul className="divide-y">
    {view.messages.map((message) => {
      const current = selected === message.location.uid
      const party = view.folder.specialUse === '\\Sent' ? message.to[0] : message.fromName || message.from
      return <li key={message.location.uid}>
        <MailLink href={mailHref(mailbox, view.folder.path, view.page, message.location)} aria-current={current ? 'page' : undefined}
          className={cn('grid min-w-0 gap-1 border-s-2 border-transparent px-4 py-3 hover:bg-accent focus-visible:bg-accent focus-visible:outline-ring',
            current && 'border-s-primary bg-accent', message.unread && 'font-semibold')}>
          <span className="flex min-w-0 items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm">{party || '(Unknown address)'}</span>
            {message.date && <span className="shrink-0 text-xs font-normal text-muted-foreground">{mailDate(message.date, timeZone)}</span>}
          </span>
          <span className="truncate text-sm text-muted-foreground">{message.subject}</span>
        </MailLink>
      </li>
    })}
  </ul>
}

function MessageReader({ messageKey, cache, backHref, summary, timeZone }: {
  messageKey: string; cache: MailCache<MailMessage>; backHref: string; summary?: MailMessageSummary; timeZone: string
}) {
  const { data: message, failure, retry } = useCachedMail(cache, messageKey, mailMessage, Infinity)
  const reply = message?.replyTo ? {
    to: message.replyTo, subject: (/^re:/i.test(message.subject) ? message.subject : `Re: ${message.subject}`).slice(0, 250),
    location: message.location,
  } : undefined

  return <ReadingPane backHref={backHref} timeZone={timeZone} message={message ?? summary} reply={reply}>
    {message ? <MessageBody message={message} /> : failure ? <div className="grid justify-items-start gap-3">
      <AdminFeedback tone={failure.missing ? 'warning' : 'error'}>{failure.message}</AdminFeedback>
      {!failure.missing && <Button variant="outline" size="sm" onClick={retry}>Try again</Button>}
    </div> : <MessageSkeleton />}
  </ReadingPane>
}

function ReadingPane({ backHref, timeZone, message, reply, children }: {
  backHref: string; timeZone: string; message?: MailMessageSummary; reply?: ComposeReply; children: ReactNode
}) {
  return <article aria-label="Reading pane" className="min-w-0 px-4 py-4 sm:p-6 lg:overflow-y-auto">
    <div className="mb-4 flex min-h-11 flex-wrap items-center justify-between gap-2 border-b pb-3">
      <Button asChild size="sm" variant="ghost" className="lg:hidden">
        <MailLink href={backHref}><ArrowLeft aria-hidden="true" /> Back to messages</MailLink>
      </Button>
      {reply && <ComposeTrigger reply={reply} />}
    </div>
    {message && <>
      <h2 className="mb-4 break-words font-heading text-xl font-semibold sm:text-2xl">{message.subject}</h2>
      <div className="mb-5 grid gap-1 text-sm">
        <p className="break-words font-medium">{message.fromName || message.from || 'Unknown sender'}</p>
        {message.fromName && message.from && <p className="break-all text-muted-foreground">{message.from}</p>}
        {message.to.length > 0 && <p className="break-words text-muted-foreground">To {message.to.join(', ')}</p>}
        {message.date && <time className="text-xs text-muted-foreground" dateTime={message.date}>{mailDate(message.date, timeZone, true)}</time>}
      </div>
    </>}
    {children}
  </article>
}

function MessageBody({ message }: { message: MailMessage }) {
  return <>
    {message.body && <p className="break-words whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>}
    {message.large && <AdminFeedback tone="info" className="mt-4">The full message is available in Porkbun webmail.</AdminFeedback>}
    {!message.body && !message.large && <p className="text-sm text-muted-foreground">This message has no readable text.</p>}
    {message.attachments.length > 0 && <ul aria-label="Attachments" className="mt-5 grid gap-2 border-t pt-4">
      {message.attachments.map((name, index) => <li key={`${index}-${name}`} className="flex min-w-0 items-start gap-2 text-sm">
        <Paperclip className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{name}</span>
      </li>)}
    </ul>}
    {(message.large || message.attachments.length > 0) && <Button asChild variant="outline" size="sm" className="mt-4">
      <a href="https://webmail.porkbun.com/" target="_blank" rel="noreferrer">Open Porkbun webmail</a>
    </Button>}
  </>
}

function FolderSkeleton() {
  return <div role="status">
    <span className="sr-only">Loading folder</span>
    <ul aria-hidden="true" className="divide-y motion-safe:animate-pulse">
      {['w-2/3', 'w-3/4', 'w-1/2', 'w-2/3', 'w-3/5'].map((width, index) =>
        <li className="grid gap-2 px-4 py-3" key={index}>
          <div className="h-3 w-1/3 rounded bg-muted" />
          <div className={cn('h-3 rounded bg-muted', width)} />
        </li>)}
    </ul>
  </div>
}

function MessageSkeleton() {
  return <div role="status" className="max-w-xl">
    <span className="sr-only">Loading message</span>
    <div aria-hidden="true" className="grid gap-2 motion-safe:animate-pulse">
      <div className="mb-3 h-3 w-1/4 rounded bg-muted" />
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-5/6 rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
      <div className="mt-4 h-3 w-1/5 rounded bg-muted" />
    </div>
  </div>
}
