'use server'

import { revalidatePath } from 'next/cache'
import { getStaff } from '@/features/accounts/server/session-service'
import { prospectUpdateSchema, reviewSchema } from './model'
import { reviewSubmission, updateContactWorkflow } from './server/prospect-service'

type Result = { ok?: boolean; message: string }

function refreshProspect(id: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/prospects')
  revalidatePath(`/admin/prospects/${id}`)
}

export async function updateProspect(_previous: Result, form: FormData): Promise<Result> {
  const result = prospectUpdateSchema.safeParse({
    prospectId: form.get('prospectId'), status: form.get('status'),
    followUpOn: form.get('followUpOn'), notes: form.get('notes'),
    recordAttempt: form.get('recordAttempt') === 'on',
  })
  try {
    if (!await getStaff()) return { message: 'Sign in to update this prospect.' }
    if (!result.success) return { message: 'Check the contact status, date, and notes.' }
    await updateContactWorkflow(result.data)
  } catch {
    return { message: 'The prospect could not be updated. Try again shortly.' }
  }
  refreshProspect(result.data.prospectId)
  return { ok: true, message: 'Contact workflow saved.' }
}

export async function reviewProspectSubmission(_previous: Result, form: FormData): Promise<Result> {
  const result = reviewSchema.safeParse({
    prospectId: form.get('prospectId'), submissionId: form.get('submissionId'),
    expectedCurrentId: form.get('expectedCurrentId'), decision: form.get('decision'),
  })
  try {
    const staff = await getStaff()
    if (!staff) return { message: 'Sign in to review this submission.' }
    if (!result.success) return { message: 'This submission could not be read.' }
    if (!await reviewSubmission(result.data, staff.id)) {
      refreshProspect(result.data.prospectId)
      return { message: 'The record has changed. Review the latest details before trying again.' }
    }
  } catch {
    return { message: 'The review could not be saved. Try again shortly.' }
  }
  refreshProspect(result.data.prospectId)
  return { ok: true, message: result.data.decision === 'apply' ? 'Update applied.' : 'Submission dismissed.' }
}
