import { z } from 'zod'
import { normalizeCountry, normalizeIndustry } from './company-fields'

export const companyRelationships = ['unclassified', 'prospect', 'client', 'former_client', 'partner'] as const
export type CompanyRelationship = typeof companyRelationships[number]
export const companyRelationshipLabels: Record<CompanyRelationship, string> = {
  unclassified: 'Unclassified', prospect: 'Prospect', client: 'Client', former_client: 'Former client', partner: 'Partner',
}

export const contactAffiliations = ['unknown', 'current', 'left_company'] as const
export type ContactAffiliation = typeof contactAffiliations[number]
export const contactAffiliationLabels: Record<ContactAffiliation, string> = {
  unknown: 'Unknown', current: 'Current', left_company: 'Left company',
}

export const recordIdSchema = z.uuid()
export const companySearchSchema = z.string().trim().max(150)
export const editVersionSchema = z.string().max(64).refine((value) => Number.isFinite(Date.parse(value)))

function optionalText(max: number) {
  return z.string().trim().max(max).transform((value) => value || undefined)
}

const name = z.string().trim().min(1, 'Enter a name.').max(150)
export const crmEmailSchema = z.string().trim().toLowerCase().max(254)
  .refine((value) => !value || z.email().safeParse(value).success, 'Enter a valid email address.')
  .transform((value) => value || undefined)

function optionalUrl(label: string, hostname?: RegExp) {
  return z.string().trim().max(2048).transform((value, ctx) => {
    if (!value) return undefined
    const url = URL.parse(/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`)
    if (!url || !['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') ||
      url.username || url.password || (hostname && !hostname.test(url.hostname))) {
      ctx.addIssue({ code: 'custom', message: `Enter a valid ${label} URL.` })
      return z.NEVER
    }
    return url.href
  })
}

export const companyFormSchema = z.object({
  name,
  website: optionalUrl('website'),
  industry: optionalText(100).transform((value) => value && normalizeIndustry(value)),
  country: optionalText(100).transform((value) => value && normalizeCountry(value)),
  relationship: z.enum(companyRelationships),
  city: optionalText(100),
  region: optionalText(100),
  phone: optionalText(50),
  email: crmEmailSchema,
  notes: optionalText(5000),
  invoiceName: optionalText(150),
  billingContact: optionalText(150),
  billingEmail: crmEmailSchema,
  billingPhone: optionalText(50),
  addressLine1: optionalText(200),
  addressLine2: optionalText(200),
  billingCity: optionalText(100),
  billingRegion: optionalText(100),
  postalCode: optionalText(30),
  billingCountry: optionalText(100).transform((value) => value && normalizeCountry(value)),
  taxNumber: optionalText(100),
})

export const contactFormSchema = z.object({
  companyId: z.uuid({ error: 'Choose a company.' }),
  name,
  email: crmEmailSchema,
  affiliation: z.enum(contactAffiliations),
  preferredName: optionalText(100),
  jobTitle: optionalText(150),
  department: optionalText(150),
  phone: optionalText(50),
  notes: optionalText(5000),
  linkedIn: optionalUrl('LinkedIn profile', /(^|\.)linkedin\.com$/i),
})

export type CompanyInput = z.output<typeof companyFormSchema>
export type ContactInput = z.output<typeof contactFormSchema>

const storedText = z.string().optional()
const billingSchema = z.looseObject({
  invoiceName: storedText,
  contactName: storedText,
  email: storedText,
  phone: storedText,
  addressLine1: storedText,
  addressLine2: storedText,
  city: storedText,
  region: storedText,
  postalCode: storedText,
  country: storedText,
  taxNumber: storedText,
})

export const companyMetadataSchema = z.looseObject({
  city: storedText, region: storedText, phone: storedText, email: storedText, notes: storedText,
  billing: billingSchema.optional(),
})

export const contactMetadataSchema = z.looseObject({
  preferredName: storedText, jobTitle: storedText, department: storedText, phone: storedText, notes: storedText,
  socials: z.looseObject({ linkedIn: storedText }).optional(),
})

export type CompanyMetadata = z.infer<typeof companyMetadataSchema>
export type ContactMetadata = z.infer<typeof contactMetadataSchema>

export type CompanyOption = { id: string; name: string; website: string | null; country: string | null }

export type CrmFormState = {
  message: string
  errors?: Record<string, string>
  duplicates?: CompanyOption[]
  reload?: boolean
}
