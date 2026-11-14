import { z } from 'zod'
import { serviceCatalog } from '@/features/catalog/catalog'
import source from './config/initial.v2.json'

const option = z.object({ id: z.string(), label: z.string(), exclusive: z.boolean().optional() })
export type QuestionOption = z.infer<typeof option>
const supplement = z.object({
  label: z.string(), maxLength: z.number().int().positive(), helpText: z.string().optional(),
})
const common = z.object({ id: z.string(), prompt: z.string(), helpText: z.string().optional() })
const choice = common.extend({
  required: z.boolean(), note: supplement.optional(),
  other: supplement.extend({ optionId: z.string() }).optional(),
})
const text = common.extend({ required: z.boolean(), maxLength: z.number().int().positive() })
const definition = z.object({
  id: z.string(), version: z.number().int().positive(), title: z.string(),
  steps: z.array(z.discriminatedUnion('type', [
    choice.extend({ type: z.literal('multiple-choice'), options: z.array(option).optional(),
      optionSource: z.literal('service-categories').optional(), maxSelections: z.number().int().positive().optional() }),
    choice.extend({ type: z.literal('single-choice'), options: z.array(option).min(1) }),
    text.extend({ type: z.literal('long-text') }),
    text.extend({ type: z.literal('short-text') }),
    common.extend({ type: z.literal('contact-details'), fields: z.array(z.object({
      id: z.enum(['name', 'companyName', 'phone', 'email']),
      type: z.enum(['text', 'tel', 'email']), label: z.string(), required: z.boolean(),
    })) }),
  ])).min(2),
})

const parsed = definition.parse(source)
export const questionnaire = {
  ...parsed,
  steps: parsed.steps.map((step) => {
    if (step.type !== 'multiple-choice') return step
    const options: QuestionOption[] = step.optionSource === 'service-categories'
      ? [...serviceCatalog.map(({ id, name }) => ({ id, label: name })), ...(step.options ?? [])]
      : step.options ?? []
    if (!options.length) throw new Error('Multiple-choice questions need options')
    return { ...step, options }
  }),
}
if (questionnaire.steps.at(-1)?.type !== 'contact-details'
  || questionnaire.steps.slice(0, -1).some((step) => step.type === 'contact-details')) {
  throw new Error('The questionnaire must end with one contact step')
}

export type Step = typeof questionnaire.steps[number]

export const answerSchema = z.object({
  value: z.union([z.string(), z.array(z.string()).max(50)]).optional(),
  note: z.string().optional(),
  otherText: z.string().optional(),
})
export const answersSchema = z.record(z.string(), answerSchema)
export type Answer = z.infer<typeof answerSchema>
export type Answers = z.infer<typeof answersSchema>

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  companyName: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(32).refine((phone) => {
    const digits = phone.replace(/\D/g, '').length
    return /^\+?[\d ().-]+$/.test(phone) && digits >= 7 && digits <= 15
  }, 'Enter a valid phone number with 7 to 15 digits.'),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email('Enter a valid email address.')),
})

export function validateAnswer(step: Step, answer: Answer = {}, allowIncomplete = false): string | null {
  if (step.type === 'contact-details') return null
  if (step.type === 'short-text' || step.type === 'long-text') {
    if (answer.value !== undefined && typeof answer.value !== 'string') return 'Enter a text answer.'
    const value = answer.value?.trim() ?? ''
    if (step.required && !allowIncomplete && !value) return 'Please answer this question.'
    return value.length > step.maxLength ? 'Please shorten your answer.' : null
  }

  const value = answer.value
  if (value !== undefined && (step.type === 'multiple-choice' ? !Array.isArray(value) : typeof value !== 'string')) {
    return 'Choose an available option.'
  }
  const selected = Array.isArray(value) ? value : value ? [value] : []
  if (step.required && !allowIncomplete && !selected.length) return 'Please select an option.'
  if (step.type === 'multiple-choice' && step.maxSelections && selected.length > step.maxSelections) {
    return 'Please choose fewer options.'
  }
  if (new Set(selected).size !== selected.length || selected.some((id) => !step.options.some((item) => item.id === id))) {
    return 'Choose an available option.'
  }
  if (selected.length > 1 && step.options.some((item) => item.exclusive && selected.includes(item.id))) {
    return 'Select this option on its own.'
  }
  if (answer.note && (!step.note || answer.note.trim().length > step.note.maxLength)) return 'Please shorten your note.'
  if (step.other && selected.includes(step.other.optionId)) {
    const details = answer.otherText?.trim() ?? ''
    if (!details && !allowIncomplete) return `Please complete the “${step.other.label}” field.`
    if (details.length > step.other.maxLength) return 'Please shorten your answer.'
  }
  return null
}

export const answerSnapshotSchema = z.array(z.object({
  id: z.string(), prompt: z.string(), values: z.array(z.string()), note: z.string(),
}))

export function snapshotAnswers(answers: Answers) {
  if (Object.keys(answers).some((id) => !questionnaire.steps.some((step) => step.id === id && step.type !== 'contact-details'))) {
    return null
  }
  const snapshots = []
  for (const step of questionnaire.steps) {
    if (step.type === 'contact-details') continue
    const answer = answers[step.id] ?? {}
    if (validateAnswer(step, answer)) return null
    const values = Array.isArray(answer.value) ? answer.value : answer.value?.trim() ? [answer.value.trim()] : []
    const labels = step.type === 'multiple-choice' || step.type === 'single-choice'
      ? values.map((id) => id === step.other?.optionId
        ? `${step.options.find((item) => item.id === id)?.label}: ${answer.otherText?.trim()}`
        : step.options.find((item) => item.id === id)!.label)
      : values
    snapshots.push({ id: step.id, prompt: step.prompt, values: labels, note: 'note' in step && step.note ? answer.note?.trim() ?? '' : '' })
  }
  return snapshots
}
