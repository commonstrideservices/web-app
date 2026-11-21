'use client'

import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { composeBodySlotAttribute } from '../config/template-layout'
import { composeBodyPlaceholder, composeLimits } from '../model'

const framePolicy = "default-src 'none'; style-src 'unsafe-inline'; img-src https:; base-uri 'none'; form-action 'none'"

function editorDocument(layout: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${framePolicy}">
  <style>
    html { color-scheme: light; }
    body { margin: 0; padding: 12px; background: #ffffff; overflow-wrap: anywhere; }
    table, td { border-collapse: collapse; }
    p { display: block; margin: 13px 0; }
    img { max-width: 100%; height: auto; }
    a { pointer-events: none; }
    [${composeBodySlotAttribute}] { display: block; }
    [${composeBodySlotAttribute}] textarea {
      display: block;
      box-sizing: border-box;
      width: 100%;
      min-height: 9rem;
      padding: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: inherit;
      field-sizing: content;
      resize: none;
    }
  </style>
</head>
<body>${layout.replace(/<img(?=[\s>])/gi, '<img loading="lazy"')}</body>
</html>`
}

export function TemplateBodyEditor({ layout, phone, body, readOnly, onBodyChange }: {
  layout: string
  phone: boolean
  body: string
  readOnly: boolean
  onBodyChange: (body: string) => void
}) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const [height, setHeight] = useState(224)
  const srcDoc = useMemo(() => editorDocument(layout), [layout])

  useEffect(() => {
    const documentBody = slot?.ownerDocument.body
    if (!documentBody) return
    const observer = new ResizeObserver(() => setHeight(Math.max(168, documentBody.offsetHeight)))
    observer.observe(documentBody)
    return () => observer.disconnect()
  }, [slot])

  function mountEditor(event: SyntheticEvent<HTMLIFrameElement>) {
    const document = event.currentTarget.contentDocument
    if (!document) return
    for (const link of document.links) link.tabIndex = -1
    setSlot(document.querySelector<HTMLElement>(`[${composeBodySlotAttribute}]`))
  }

  return <div className="flex justify-center rounded-md border bg-muted p-1 sm:p-3">
    <iframe className={cn('block w-full rounded-sm bg-white', phone && 'max-w-[360px]')}
      style={{ height }} title="Message template" sandbox="allow-same-origin" referrerPolicy="no-referrer"
      srcDoc={srcDoc} onLoad={mountEditor} />
    {slot && createPortal(<textarea aria-label="Message" placeholder={composeBodyPlaceholder} rows={6} maxLength={composeLimits.body}
      value={body} readOnly={readOnly} onChange={(event) => onBodyChange(event.target.value)} />, slot)}
  </div>
}
