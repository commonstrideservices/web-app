import 'server-only'

import { createHash } from 'node:crypto'
import { asc, eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { convert } from 'html-to-text'
import mjmlToHtml from 'mjml'
import sanitizeHtml from 'sanitize-html'
import { getDatabase } from '@/lib/db/server'
import { emailTemplateFragments, emailTemplates } from '@/lib/db/schema'
import { professionalEmailFragments, professionalEmailHtml, professionalTemplate } from '../config/professional-template'
import { bodySlot, brandedTemplateHtml, composeBodySlotAttribute, maxTemplateHtmlLength, plainTemplateHtml } from '../config/template-layout'
import type { ComposeLibrary, TemplateInput, TemplateSummary } from '../model'
import { EmailError } from './access'

const color = /^#[0-9a-f]{6}$/i
const spacing = /^(?:0|[1-9]\d?px)(?: (?:0|[1-9]\d?px)){0,3}$/
const divider = /^[1-4]px solid #[0-9a-f]{6}$/i
const width = /^(?:100%|[1-9]\d{0,2}px)$/
const fontName = /(?:[a-z][a-z0-9 -]{0,40}|"[a-z][a-z0-9 -]{0,40}"|'[a-z][a-z0-9 -]{0,40}')/i.source
const fontStack = new RegExp(`^${fontName}(?:\\s*,\\s*${fontName}){0,7}$`, 'i')
const previousProfessionalHtml = 'b0de06513620f57e458c1d7186505265fd83d638a19e80c666e119fdf56ace93'
const bodySlotPattern = /\{\{(?:body|message)\}\}/g
const editorBodySlot = `<span ${composeBodySlotAttribute}></span>`
const previousProfessionalFragments = {
  header: ['2bf699f4b90d93ca2a7ca26ae966ee3bf69749f8be256cc63564c689a8efcf8f'],
  footer: [
    '834c8e6b93932ce1cef2080fa1dbdc429590b33536b8c6730cf60195c8d671b8',
    'e2c0b1ae65f26136bbf9670f0d55d7e2d0e1bec7a38e09d5a05f34877adf6690',
  ],
}

function cleanEmailHtml(html: string, textFilter?: (text: string) => string) {
  return sanitizeHtml(html, {
    allowedTags: ['div', 'p', 'br', 'wbr', 'strong', 'b', 'em', 'i', 'u', 'a', 'img', 'span', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote'],
    nonTextTags: ['script', 'style', 'textarea', 'option', 'title'],
    allowedAttributes: {
      '*': ['style'],
      a: ['href', 'title'], img: ['src', 'alt', 'width', 'height'],
      table: ['role', 'width', 'border', 'cellpadding', 'cellspacing', 'align'],
      td: ['width', 'valign', 'bgcolor', 'align', 'colspan', 'rowspan'],
      th: ['width', 'valign', 'bgcolor', 'align', 'colspan', 'rowspan', 'scope'],
      div: ['align', 'bgcolor'], p: ['align'],
    },
    allowedStyles: {
      '*': {
        color: [color], 'background-color': [color], 'font-family': [fontStack],
        'font-size': [/^[1-9]\d?px$/], 'line-height': [/^[1-2](?:\.\d{1,2})?$/, /^[1-9]\d?px$/],
        'font-weight': [/^(?:normal|bold|[1-9]00)$/], 'font-style': [/^(?:normal|italic)$/],
        'text-align': [/^(?:left|center|right|justify)$/], 'text-decoration': [/^(?:none|underline)$/],
        margin: [spacing], padding: [spacing], width: [width], 'max-width': [width],
        'border-bottom': [divider], 'border-top': [divider], 'border-collapse': [/^collapse$/],
      },
    },
    allowedSchemes: ['https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['https'] },
    allowProtocolRelative: false,
    textFilter,
    transformTags: {
      body: 'div',
      a: (tagName, attributes) => {
        if (!/^(https:\/\/|mailto:|tel:)/i.test(attributes.href ?? '')) delete attributes.href
        return { tagName, attribs: attributes }
      },
      img: (tagName, attributes) => {
        const at = { ...attributes }
        if (!/^https:\/\//i.test(at.src ?? '')) delete at.src
        if (!/^[1-9]\d{0,2}$/.test(at.width ?? '') || Number(at.width) > 540) delete at.width
        if (!/^[1-9]\d{0,2}$/.test(at.height ?? '')) delete at.height
        return { tagName, attribs: at }
      },
    },
  }).trim()
}

function cleanTemplateHtml(html: string) {
  const slotError = 'Place {{body}} exactly once as visible text in the template HTML.'
  const [slot, extra] = html.match(bodySlotPattern) ?? []
  if (!slot || extra) throw new EmailError(slotError)
  let hasTextSlot = false
  const cleaned = cleanEmailHtml(html, (text) => {
    if (text.includes(slot)) hasTextSlot = true
    return text
  })
  if (!hasTextSlot || cleaned.match(bodySlotPattern)?.length !== 1) throw new EmailError(slotError)
  if (cleaned.length > maxTemplateHtmlLength) throw new EmailError('The template HTML is too long.')
  return cleaned.replace(slot, bodySlot)
}

function templateFingerprint(html: string) {
  const normalized = html.replace(/>\s+</g, '><').replace(/\s+/g, ' ')
  return createHash('sha256').update(normalized).digest('hex')
}

function legacyFragmentHtml(html: string | null, kind: 'header' | 'footer') {
  if (!html) return ''
  const cleaned = cleanEmailHtml(html)
  if (!cleaned.includes('commonstrideservices.com')) return cleaned
  // Preserve the earlier preset refresh for both installed and pasted copies.
  return previousProfessionalFragments[kind].includes(templateFingerprint(cleaned))
    ? cleanEmailHtml(professionalEmailFragments()[kind])
    : cleaned
}

const templateSummary = {
  id: emailTemplates.id, name: emailTemplates.name, subject: emailTemplates.subject, body: emailTemplates.body,
}
const header = alias(emailTemplateFragments, 'template_header')
const footer = alias(emailTemplateFragments, 'template_footer')

function templateQuery() {
  return getDatabase().select({
    ...templateSummary, html: emailTemplates.html, legacyHeader: header.html, legacyFooter: footer.html,
  }).from(emailTemplates)
    .leftJoin(header, eq(emailTemplates.header_id, header.id))
    .leftJoin(footer, eq(emailTemplates.footer_id, footer.id))
}

function legacyLayout(template: { legacyHeader: string | null; legacyFooter: string | null }, message: string) {
  const headerHtml = legacyFragmentHtml(template.legacyHeader, 'header')
  const footerHtml = legacyFragmentHtml(template.legacyFooter, 'footer')
  return headerHtml || footerHtml ? brandedTemplateHtml(headerHtml, footerHtml, message) : plainTemplateHtml(message)
}

function savedLayout({ id, html }: { id: string; html: string | null }) {
  if (html && id === professionalTemplate.id && templateFingerprint(html) === previousProfessionalHtml) {
    return cleanTemplateHtml(professionalEmailHtml())
  }
  return html
}

type StoredTemplate = Awaited<ReturnType<typeof templateQuery>>[number]
export type EmailTemplate = TemplateSummary & { html: string }

function composeLayout(template: StoredTemplate) {
  const html = savedLayout(template)
  const layout = html === null
    ? legacyLayout(template, editorBodySlot)
    : cleanTemplateHtml(html).replace(bodySlot, editorBodySlot)
  return { layout, revision: createHash('sha256').update(layout).digest('hex') }
}

export async function getTemplateLibrary(): Promise<EmailTemplate[]> {
  const templates = await templateQuery().orderBy(asc(emailTemplates.name), asc(emailTemplates.id))
  return templates.map(({ id, name, subject, body, html, legacyHeader, legacyFooter }) => ({
    id, name, subject, body, html: savedLayout({ id, html })?.replace(bodySlotPattern, bodySlot) ?? legacyLayout({ legacyHeader, legacyFooter }, bodySlot),
  }))
}

export async function getComposeLibrary(): Promise<ComposeLibrary | null> {
  try {
    const templates = await templateQuery().orderBy(asc(emailTemplates.name), asc(emailTemplates.id))
    return { templates: templates.map((template) => {
      const { id, name, subject, body } = template
      return { id, name, subject, body, ...composeLayout(template) }
    }) }
  } catch {
    return null
  }
}

export async function saveTemplate(input: TemplateInput) {
  const db = getDatabase()
  const values = {
    name: input.name,
    subject: input.subject,
    body: input.body,
    html: cleanTemplateHtml(input.html),
    updated_at: sql`now()`,
  }
  if (input.id) {
    const [saved] = await db.update(emailTemplates).set(values).where(eq(emailTemplates.id, input.id))
      .returning({ id: emailTemplates.id })
    if (!saved) throw new EmailError('This template could not be found.')
  } else await db.insert(emailTemplates).values(values)
}

export async function removeTemplate(id: string) {
  await getDatabase().delete(emailTemplates).where(eq(emailTemplates.id, id))
}

export async function addProfessionalTemplate() {
  const { id, name } = professionalTemplate
  const html = cleanTemplateHtml(professionalEmailHtml())
  await getDatabase().insert(emailTemplates).values({ id, name, subject: '', body: '', html })
    .onConflictDoNothing({ target: emailTemplates.id })
}

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

async function messageLayout(message: string, templateId: string | null, templateRevision: string | null) {
  if (!templateId) return plainTemplateHtml(message)
  const [template] = await templateQuery().where(eq(emailTemplates.id, templateId))
  if (!template) throw new EmailError('This template was deleted. Choose another template or No template.')
  const { layout, revision } = composeLayout(template)
  if (revision !== templateRevision) throw new EmailError('This template changed. Reload Email to use the latest version.')
  return layout.replace(editorBodySlot, () => message)
}

export async function renderEmail(body: string, templateId: string | null, templateRevision: string | null) {
  const message = escapeHtml(body).replace(/\r\n?|\n/g, '<br />')
  const layout = await messageLayout(message, templateId, templateRevision)
  const compiled = await mjmlToHtml(`
    <mjml>
      <mj-head>
        <mj-style inline="inline">img { max-width: 100%; height: auto; }</mj-style>
      </mj-head>
      <mj-body width="600px" background-color="#ffffff">
        <mj-raw>${layout}</mj-raw>
      </mj-body>
    </mjml>
  `, { validationLevel: 'strict', ignoreIncludes: true })
  const text = templateId
    ? convert(layout, { wordwrap: false, selectors: [{ selector: 'img', format: 'skip' }] }) || body
    : body
  return { html: compiled.html, text }
}
