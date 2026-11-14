'use client'

import { useActionState, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CircleCheck } from 'lucide-react'
import { z } from 'zod'
import { IntakeServerAction } from '../intake-server-action'
import { answersSchema, contactSchema, questionnaire, validateAnswer, type Answer, type Answers, type QuestionOption, type Step } from '../model'

const draftKey = `common-stride:${questionnaire.id}:v${questionnaire.version}`
const legacyDraftKey = `common-stride:${questionnaire.id}:v1`
const draftSchema = z.object({
  step: z.number().int().min(0).max(questionnaire.steps.length - 1),
  answers: answersSchema,
  submissionId: z.uuid(),
})
const legacyDraftSchema = draftSchema.extend({ step: z.number().int().min(0).max(6) })
const noSubscription = () => () => {}
const emptyContact = { name: '', companyName: '', phone: '', email: '' }
const autofill = { name: 'name', companyName: 'organization', phone: 'tel', email: 'email' }

function migrateLegacyAnswers(answers: Answers): Answers {
  const services = answers['service-interests']?.value
  const goal = answers['project-goal']?.value
  const budget = answers['budget-range']?.value
  const migrated: Answers = { ...answers }

  if (Array.isArray(services)) {
    const specificServices = services.filter((service) => service !== 'help-me-choose')
    migrated['service-interests'] = {
      value: specificServices.length ? specificServices : services,
      note: typeof goal === 'string' ? goal : undefined,
    }
  }
  if (typeof budget === 'string' && budget.trim()) {
    migrated['budget-range'] = /^not sure(?: yet)?[.!]?$/i.test(budget.trim())
      ? { value: 'needs-estimate' }
      : { value: 'has-range', otherText: budget }
  }
  return migrated
}

function loadDraft() {
  try {
    const current = localStorage.getItem(draftKey)
    const isLegacy = current === null
    const draft = (isLegacy ? legacyDraftSchema : draftSchema)
      .safeParse(JSON.parse(current ?? localStorage.getItem(legacyDraftKey) ?? 'null'))
    if (draft.success) {
      const savedAnswers = isLegacy ? migrateLegacyAnswers(draft.data.answers) : draft.data.answers
      const steps = questionnaire.steps.filter((step) => step.type !== 'contact-details')
      const answers = Object.fromEntries(steps.flatMap((step) => {
        const answer = savedAnswers[step.id]
        return answer && !validateAnswer(step, answer, true) ? [[step.id, answer]] : []
      }))
      const firstMissingStep = steps.findIndex((step) => validateAnswer(step, answers[step.id]))
      const step = isLegacy ? Math.min(draft.data.step, steps.length) : draft.data.step
      return { ...draft.data, answers, step: firstMissingStep < 0 ? step : Math.min(firstMissingStep, step) }
    }
  } catch {
    // The questionnaire can still run when browser storage is blocked.
  }
  return { step: 0, answers: {} as Answers, submissionId: crypto.randomUUID() }
}

export function IntakeQuestionnaire() {
  const hydrated = useSyncExternalStore(noSubscription, () => true, () => false)
  const [formNumber, setFormNumber] = useState(0)
  return <IntakeForm key={`${hydrated}:${formNumber}`} useDraft={hydrated}
    startAnother={() => setFormNumber((current) => current + 1)} />
}

function IntakeForm({ useDraft, startAnother }: { useDraft: boolean; startAnother: () => void }) {
  const [draft, setDraft] = useState(() => useDraft ? loadDraft() : { step: 0, answers: {} as Answers, submissionId: '' })
  const [contact, setContact] = useState(emptyContact)
  const [error, setError] = useState('')
  const [result, submit, pending] = useActionState(IntakeServerAction.submit, { message: '' })
  const heading = useRef<HTMLHeadingElement>(null)
  const previousStep = useRef(draft.step)
  const step = questionnaire.steps[draft.step]
  const answer = draft.answers[step.id] ?? {}
  const stepError = validateAnswer(step, answer)
  const contactResult = step.type === 'contact-details' ? contactSchema.safeParse(contact) : null
  const contactErrors = contactResult?.success === false ? z.flattenError(contactResult.error).fieldErrors : null
  const canContinue = stepError === null && (contactResult?.success ?? true)

  useEffect(() => {
    if (previousStep.current === draft.step) return
    previousStep.current = draft.step
    heading.current?.focus()
  }, [draft.step])

  useEffect(() => {
    if (!useDraft) return
    try {
      if (result.ok) localStorage.removeItem(draftKey)
      else localStorage.setItem(draftKey, JSON.stringify(draft))
      localStorage.removeItem(legacyDraftKey)
    } catch {
      // Saving the draft is optional when browser storage is unavailable.
    }
  }, [draft, result.ok, useDraft])

  function setAnswer(value: Answer) {
    setDraft((previous) => ({ ...previous, answers: { ...previous.answers, [step.id]: value } }))
    setError('')
  }

  function moveTo(nextStep: number) {
    setError('')
    setDraft((previous) => ({ ...previous, step: nextStep }))
  }

  function advance(event: FormEvent<HTMLFormElement>) {
    if (step.type === 'contact-details' && canContinue) return
    event.preventDefault()
    if (canContinue) moveTo(draft.step + 1)
    else setError(stepError ?? 'Check the required contact details.')
  }

  if (result.ok) {
    return (
      <section className="site-shell grid min-h-[32rem] place-items-center py-16">
        <div className="w-full max-w-xl rounded-3xl border border-rule p-8 text-center sm:p-12">
          <CircleCheck className="mx-auto mb-5 text-brand" size={42} aria-hidden="true" />
          <h1 className="font-heading text-4xl font-bold tracking-tight">Inquiry received</h1>
          <p role="status" className="mt-3 text-copy">{result.message}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-5">
            <Link href="/" className="site-button">Back to home <ArrowUpRight size={16} aria-hidden="true" /></Link>
            <button type="button" onClick={startAnother} className="text-sm font-semibold hover:text-brand">Start another inquiry</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="site-shell grid gap-8 py-10 sm:py-16 lg:grid-cols-[0.62fr_1fr] lg:gap-16">
      <div className="lg:pt-7">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-copy hover:text-brand">
          <ArrowLeft size={16} className="shrink-0" aria-hidden="true" /> Back to home
        </Link>
        <h1 className="mt-5 font-heading text-5xl leading-[0.98] font-extrabold tracking-[-0.065em] sm:text-6xl">Connect with us<span className="text-brand">.</span></h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-copy">Tell us what you need so we can make the most of our first conversation.</p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-copy">
          We use your answers and contact details to respond and follow up. See our{' '}
          <Link href="/privacy-policy" className="font-semibold text-ink underline decoration-brand underline-offset-4">Privacy Policy</Link>{' '}
          and <Link href="/terms-of-service" className="font-semibold text-ink underline decoration-brand underline-offset-4">Terms of Service</Link>.
        </p>
      </div>

      <form action={submit} onSubmit={advance} className="min-w-0 rounded-3xl border border-rule bg-paper/50 p-5 sm:p-9">
        <div className="mb-7">
          <p className="mb-2.5 text-xs font-semibold text-ink">Step {draft.step + 1} of {questionnaire.steps.length}</p>
          <div role="progressbar" aria-label="Questionnaire progress" aria-valuenow={draft.step + 1}
            aria-valuemin={1} aria-valuemax={questionnaire.steps.length}
            aria-valuetext={`Step ${draft.step + 1} of ${questionnaire.steps.length}`}
            className="grid auto-cols-fr grid-flow-col gap-1.5">
            {questionnaire.steps.map((question, index) => (
              <span key={question.id} aria-hidden="true"
                className={`h-1.5 min-w-0 rounded-full ${index <= draft.step ? 'bg-brand' : 'bg-rule'}`} />
            ))}
          </div>
        </div>
        <h2 ref={heading} tabIndex={-1} id="intake-question" className="font-heading text-3xl leading-tight font-bold tracking-[-0.045em] outline-none sm:text-4xl">{step.prompt}</h2>
        {step.helpText && <p className="mt-2 text-sm leading-relaxed text-copy">{step.helpText}</p>}
        <div className="mt-5">
          {step.type === 'contact-details' ? (
            <fieldset disabled={pending} aria-labelledby="intake-question" className="grid min-w-0 gap-4 sm:grid-cols-2">
              {step.fields.map((field) => {
                const message = contact[field.id].trim() ? contactErrors?.[field.id]?.[0] : null
                const messageId = `${field.id}-error`
                return (
                  <label key={field.id} className="grid min-w-0 content-start gap-1.5 text-sm font-medium">
                    <span>{field.label}</span>
                    <input className="site-field" name={field.id} type={field.type} required={field.required}
                      aria-invalid={Boolean(message)} aria-describedby={message ? messageId : undefined}
                      autoCapitalize={field.type === 'email' ? 'none' : undefined}
                      autoComplete={autofill[field.id]} maxLength={{ name: 120, companyName: 160, phone: 32, email: 254 }[field.id]}
                      value={contact[field.id]} onChange={(event) => {
                        const { value } = event.currentTarget
                        setContact({ ...contact, [field.id]: field.type === 'email' ? value.toLowerCase() : value })
                        setError('')
                      }} />
                    {message && <span id={messageId} className="text-xs text-ink">{message}</span>}
                  </label>
                )
              })}
              <input type="hidden" name="submissionId" value={draft.submissionId} />
              <input type="hidden" name="version" value={questionnaire.version} />
              <input type="hidden" name="answers" value={JSON.stringify(draft.answers)} />
            </fieldset>
          ) : <QuestionInput key={step.id} step={step} answer={answer} onChange={setAnswer} />}
        </div>
        {(error || (step.type === 'contact-details' && result.message)) &&
          <p role="alert" className="mt-4 text-sm font-medium text-ink">{error || result.message}</p>}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5">
          <button type="button" onClick={() => moveTo(draft.step - 1)} disabled={draft.step === 0 || pending}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-copy hover:text-ink disabled:opacity-40">
            <ArrowLeft size={16} className="shrink-0" aria-hidden="true" /> Back
          </button>
          <button type="submit" className="site-button" disabled={pending || !useDraft || !canContinue}>
            {step.type === 'contact-details' ? pending ? 'Submitting…' : 'Submit inquiry' : 'Continue'}
            <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
          </button>
        </div>
      </form>
    </section>
  )
}

function QuestionInput({ step, answer, onChange }: {
  step: Exclude<Step, { type: 'contact-details' }>
  answer: Answer
  onChange: (answer: Answer) => void
}) {
  if (step.type === 'long-text' || step.type === 'short-text') {
    const Field = step.type === 'long-text' ? 'textarea' : 'input'
    return <Field className="site-field" aria-labelledby="intake-question" maxLength={step.maxLength} required={step.required}
      rows={step.type === 'long-text' ? 4 : undefined} value={typeof answer.value === 'string' ? answer.value : ''}
      onChange={(event) => onChange({ value: event.target.value })} />
  }

  const selected = Array.isArray(answer.value) ? answer.value : answer.value ? [answer.value] : []
  const multiple = step.type === 'multiple-choice'

  function chooseOption(item: QuestionOption) {
    if (!multiple) {
      onChange({ ...answer, value: item.id })
      return
    }
    if (selected.includes(item.id)) {
      onChange({ ...answer, value: selected.filter((id) => id !== item.id) })
      return
    }
    if (item.exclusive) {
      onChange({ ...answer, value: [item.id] })
      return
    }
    const remaining = selected.filter((id) => !step.options.some((option) => option.id === id && option.exclusive))
    onChange({ ...answer, value: [...remaining, item.id] })
  }

  return (
    <fieldset aria-labelledby="intake-question" className="grid min-w-0 gap-2.5">
      {step.options.map((item) => {
        const checked = selected.includes(item.id)
        return (
          <label key={item.id} className={`flex min-h-18 cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm leading-5 font-medium hover:border-brand focus-within:ring-2 focus-within:ring-brand ${checked ? 'border-brand' : 'border-rule'}`}>
            <span className="relative flex size-5 shrink-0 items-center justify-center">
              <input type={multiple ? 'checkbox' : 'radio'} name={step.id} value={item.id} checked={checked}
                required={step.required && !multiple}
                onChange={() => chooseOption(item)}
                className={`size-5 shrink-0 appearance-none border border-copy/50 bg-white checked:border-brand checked:bg-brand ${multiple ? 'rounded-[4px]' : 'rounded-full'}`} />
              {checked && (multiple
                ? <Check size={14} strokeWidth={3} className="pointer-events-none absolute shrink-0 text-brand-foreground" aria-hidden="true" />
                : <span className="pointer-events-none absolute size-2 rounded-full bg-brand-foreground" aria-hidden="true" />)}
            </span>
            <span className="min-w-0">{item.label}</span>
          </label>
        )
      })}
      {step.other && selected.includes(step.other.optionId) && (
        <div className="mt-2 grid gap-1.5">
          <label htmlFor="intake-option-details" className="text-sm font-medium">{step.other.label}</label>
          {step.other.helpText && <p id="intake-option-help" className="text-sm text-copy">{step.other.helpText}</p>}
          <input id="intake-option-details" className="site-field" required maxLength={step.other.maxLength}
            aria-describedby={step.other.helpText ? 'intake-option-help' : undefined}
            value={answer.otherText ?? ''} onChange={(event) => onChange({ ...answer, otherText: event.target.value })} />
        </div>
      )}
      {step.note && (
        <div className="mt-2 grid gap-1.5">
          <label htmlFor="intake-note" className="text-sm font-medium">{step.note.label} <span className="font-normal text-copy">(optional)</span></label>
          {step.note.helpText && <p id="intake-note-help" className="text-sm text-copy">{step.note.helpText}</p>}
          <textarea id="intake-note" className="site-field" rows={2} maxLength={step.note.maxLength}
            aria-describedby={step.note.helpText ? 'intake-note-help' : undefined}
            value={answer.note ?? ''} onChange={(event) => onChange({ ...answer, note: event.target.value })} />
        </div>
      )}
    </fieldset>
  )
}
