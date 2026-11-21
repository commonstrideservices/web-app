'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { ZodError } from 'zod'
import { getStaff } from '@/features/accounts/server/session-service'
import { directoryReturn } from './directory'
import {
  companyFormSchema, companySearchSchema, contactFormSchema, editVersionSchema,
  recordIdSchema, type CrmFormState,
} from './model'
import { findCompanyOptions } from './server/directory-service'
import { saveCompany, saveContact } from './server/record-service'

function formValues(form: FormData, shape: Record<string, unknown>) {
  return Object.fromEntries(Object.keys(shape).map((key) => [key, form.get(key) ?? '']))
}

function invalidFields(error: ZodError): CrmFormState {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = String(issue.path[0])
    errors[field] ??= issue.message
  }
  return { message: 'Check the highlighted fields.', errors }
}

function editIdentity(id: string | null, version: string | null) {
  if (id === null && version === null) return null
  const record = recordIdSchema.safeParse(id)
  const timestamp = editVersionSchema.safeParse(version)
  if (record.success && timestamp.success) return { id: record.data, version: timestamp.data }
}

function hasDatabaseError(error: unknown, code: string, constraint: string): boolean {
  if (!(error instanceof Error)) return false
  if ('code' in error && error.code === code && 'constraint_name' in error && error.constraint_name === constraint) {
    return true
  }
  return hasDatabaseError(error.cause, code, constraint)
}

function openSavedRecord(section: 'companies' | 'contacts', id: string, from: string): never {
  revalidatePath('/admin/companies')
  revalidatePath('/admin/companies/[id]', 'page')
  revalidatePath('/admin/contacts')
  revalidatePath(`/admin/${section}/${id}`)
  const params = new URLSearchParams({ from: directoryReturn(from, `/admin/${section}`), saved: '1' })
  redirect(`/admin/${section}/${id}?${params}`)
}

const denied: CrmFormState = { message: 'Only administrators can make this change.' }
const conflict: CrmFormState = { message: 'This record changed while you were editing it. Reload the latest details before saving.', reload: true }

export async function upsertCompany(id: string | null, version: string | null, from: string, _previous: CrmFormState, form: FormData): Promise<CrmFormState> {
  const staff = await getStaff()
  if (staff?.role !== 'admin') return denied
  const edit = editIdentity(id, version)
  if (edit === undefined) return conflict
  const input = companyFormSchema.safeParse(formValues(form, companyFormSchema.shape))
  if (!input.success) return invalidFields(input.error)

  let saved
  try {
    saved = await saveCompany(input.data, staff.id, edit, form.get('confirmDuplicate') === 'yes')
  } catch {
    return { message: 'The company could not be saved. Try again shortly.' }
  }
  if ('conflict' in saved) return conflict
  if ('duplicates' in saved) {
    return { message: 'A company with this name or website already exists. Review the matches before saving.', duplicates: saved.duplicates }
  }
  return openSavedRecord('companies', saved.id, from)
}

export async function upsertContact(id: string | null, version: string | null, from: string, _previous: CrmFormState, form: FormData): Promise<CrmFormState> {
  const staff = await getStaff()
  if (staff?.role !== 'admin') return denied
  const edit = editIdentity(id, version)
  if (edit === undefined) return conflict
  const input = contactFormSchema.safeParse(formValues(form, contactFormSchema.shape))
  if (!input.success) return invalidFields(input.error)

  let saved
  try {
    saved = await saveContact(input.data, staff.id, edit)
  } catch (error) {
    if (hasDatabaseError(error, '23505', 'contacts_company_email_key')) {
      return { message: 'Check the highlighted fields.', errors: { email: 'This company already has a contact with this email.' } }
    }
    if (hasDatabaseError(error, '23503', 'contacts_company_id_fkey')) {
      return { message: 'Check the highlighted fields.', errors: { companyId: 'Choose an existing company.' } }
    }
    return { message: 'The contact could not be saved. Try again shortly.' }
  }
  if ('conflict' in saved) return conflict
  return openSavedRecord('contacts', saved.id, from)
}

export async function searchCompanies(query: string) {
  if (!await getStaff()) return []
  const result = companySearchSchema.safeParse(query)
  return result.success ? findCompanyOptions(result.data) : []
}
