import { countrySuggestions, industrySuggestions, subdivisionLabel } from '../company-fields'
import type { CompanyMetadata, ContactMetadata } from '../model'
import {
  companyRelationshipLabels, companyRelationships, contactAffiliationLabels, contactAffiliations,
} from '../model'
import type { RecordSection } from './record-form'

export function companySections(saved: { industries: string[]; countries: string[] }): RecordSection[] {
  const industries = [...new Set([...saved.industries, ...industrySuggestions])]
  const countries = [...new Set([...saved.countries, ...countrySuggestions])]
  return [
    { title: 'Company information', fields: [
      { name: 'name', label: 'Company name', required: true, max: 150 },
      { name: 'website', label: 'Website', type: 'url', max: 2048 },
      { name: 'relationship', label: 'Relationship', type: 'select',
        options: companyRelationships.map((value) => ({ value, label: companyRelationshipLabels[value] })) },
      { name: 'industry', label: 'Industry', max: 100, suggestions: industries },
      { name: 'country', label: 'Country', max: 100, suggestions: countries },
      { name: 'region', label: subdivisionLabel, max: 100 },
      { name: 'city', label: 'City', max: 100 },
      { name: 'email', label: 'General email', type: 'email', max: 254 },
      { name: 'phone', label: 'Main phone', type: 'tel', max: 50 },
      { name: 'notes', label: 'Internal notes', type: 'textarea', wide: true, max: 5000 },
    ] },
    { title: 'Billing information (optional)', fields: [
      { name: 'invoiceName', label: 'Legal or invoice name', max: 150 },
      { name: 'taxNumber', label: 'Tax or registration number', max: 100 },
      { name: 'billingContact', label: 'Billing contact name', max: 150 },
      { name: 'billingEmail', label: 'Billing email', type: 'email', max: 254 },
      { name: 'billingPhone', label: 'Billing phone', type: 'tel', max: 50 },
      { name: 'addressLine1', label: 'Billing address line 1', max: 200, wide: true },
      { name: 'addressLine2', label: 'Billing address line 2', max: 200, wide: true },
      { name: 'billingCity', label: 'Billing city', max: 100 },
      { name: 'billingRegion', label: `Billing ${subdivisionLabel.toLowerCase()}`, max: 100 },
      { name: 'postalCode', label: 'Billing postal code', max: 30 },
      { name: 'billingCountry', label: 'Billing country', max: 100, suggestions: countries },
    ] },
  ]
}

export const contactSections: RecordSection[] = [
  { title: 'Contact information', fields: [
    { name: 'companyId', label: 'Company', type: 'company', required: true },
    { name: 'affiliation', label: 'Affiliation', type: 'select',
      options: contactAffiliations.map((value) => ({ value, label: contactAffiliationLabels[value] })) },
    { name: 'name', label: 'Full name', required: true, max: 150 },
    { name: 'preferredName', label: 'Preferred first name', max: 100 },
    { name: 'jobTitle', label: 'Job title', max: 150 },
    { name: 'department', label: 'Department', max: 150 },
    { name: 'email', label: 'Work email', type: 'email', max: 254 },
    { name: 'phone', label: 'Phone', type: 'tel', max: 50 },
    { name: 'linkedIn', label: 'LinkedIn profile URL', type: 'url', max: 2048, wide: true },
    { name: 'notes', label: 'Internal notes', type: 'textarea', wide: true, max: 5000 },
  ] },
]

export function companyMetadataFields(metadata: CompanyMetadata) {
  const billing = metadata.billing
  return {
    city: metadata.city, region: metadata.region, phone: metadata.phone, email: metadata.email, notes: metadata.notes,
    invoiceName: billing?.invoiceName, billingContact: billing?.contactName, billingEmail: billing?.email,
    billingPhone: billing?.phone, addressLine1: billing?.addressLine1, addressLine2: billing?.addressLine2,
    billingCity: billing?.city, billingRegion: billing?.region, billingCountry: billing?.country,
    postalCode: billing?.postalCode, taxNumber: billing?.taxNumber,
  }
}

export function contactMetadataFields(metadata: ContactMetadata) {
  return {
    preferredName: metadata.preferredName, jobTitle: metadata.jobTitle, department: metadata.department,
    phone: metadata.phone, notes: metadata.notes, linkedIn: metadata.socials?.linkedIn,
  }
}
