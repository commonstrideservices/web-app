'use server'

import { z } from 'zod'
import { allowRequest } from '@/lib/rate-limit'
import { databaseUrl } from '@/lib/db/server'
import { answersSchema, contactSchema, questionnaire, snapshotAnswers } from './model'
import { saveInitialIntake } from './server/intake-service'

type IntakeResult = { ok?: boolean; message: string }

export async function submitIntake(_previous: IntakeResult, form: FormData): Promise<IntakeResult> {
  const submissionId = z.uuid().safeParse(form.get('submissionId'))
  const payload = form.get('answers')
  const contact = contactSchema.safeParse({
    name: form.get('name'), companyName: form.get('companyName'),
    phone: form.get('phone'), email: form.get('email'),
  })
  if (!contact.success) return { message: 'Check your name, company name, phone number, and email address.' }
  if (!submissionId.success || typeof payload !== 'string' || payload.length > 16_000
    || form.get('version') !== String(questionnaire.version)) {
    return { message: 'Your questionnaire could not be read. Refresh the page and check your answers.' }
  }

  try {
    const parsed = answersSchema.safeParse(JSON.parse(payload))
    const answers = parsed.success ? snapshotAnswers(parsed.data) : null
    if (!answers) return { message: 'Please go back and check your questionnaire answers.' }
    if (!databaseUrl()) return { message: 'Submissions are temporarily unavailable. Please try again later.' }
    if (!await allowRequest('intake', contact.data.email, { perIdentity: 5, perNetwork: 40 })) {
      return { message: 'Too many submissions. Please try again in a few minutes.' }
    }

    await saveInitialIntake({
      ...contact.data, submissionId: submissionId.data, version: questionnaire.version, answers,
    })
    return { ok: true, message: 'Thanks for telling us about your project. We’ll email you soon, so keep an eye on your inbox.' }
  } catch {
    return { message: 'We couldn’t save your inquiry. Please try again.' }
  }
}
