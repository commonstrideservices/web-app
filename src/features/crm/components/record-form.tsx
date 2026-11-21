'use client'

import Link from 'next/link'
import { useActionState, useId, useState } from 'react'
import { AdminFeedback } from '@/features/admin/components/admin-status'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { crmEmailSchema, type CompanyOption, type CrmFormState } from '../model'
import { CompanyPicker } from './company-picker'
import { SuggestionInput } from './suggestion-input'

export type RecordAction = (previous: CrmFormState, form: FormData) => Promise<CrmFormState>
export type RecordField = {
  name: string
  label: string
  required?: boolean
  wide?: boolean
  type?: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select' | 'company'
  max?: number
  options?: { value: string; label: string }[]
  suggestions?: readonly string[]
}
export type RecordSection = { title: string; fields: RecordField[] }

export function RecordForm({ action, sections, initial, company, cancel, submitLabel }: {
  action: RecordAction; sections: RecordSection[]; initial: Record<string, string | null | undefined>;
  company?: CompanyOption; cancel: string; submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, { message: '' })
  const [values, setValues] = useState(initial)
  const [submittedValues, setSubmittedValues] = useState(initial)
  const [checkedEmails, setCheckedEmails] = useState<Record<string, boolean>>({})
  const [duplicateReviewed, setDuplicateReviewed] = useState(false)
  const prefix = useId()
  const showDuplicates = duplicateReviewed && Boolean(state.duplicates?.length)

  return <form action={formAction} className="grid max-w-4xl gap-4" onSubmit={() => {
    setDuplicateReviewed(true)
    setSubmittedValues(values)
  }}>
    <fieldset disabled={pending} className="grid min-w-0 gap-4 disabled:opacity-75">
      {sections.map(({ title, fields }) => <Card key={title} className="gap-4 py-4 sm:py-5">
        <CardHeader className="px-4 sm:px-5"><CardTitle><h2>{title}</h2></CardTitle></CardHeader>
        <CardContent className="grid gap-4 px-4 sm:grid-cols-2 sm:px-5">
          {fields.map((field) => {
            const id = prefix + field.name
            const value = values[field.name] ?? ''
            const email = field.type === 'email'
            const validation = email && checkedEmails[field.name] ? crmEmailSchema.safeParse(value) : undefined
            const emailError = validation?.success === false ? validation.error.issues[0]?.message : undefined
            const serverError = value === (submittedValues[field.name] ?? '') ? state.errors?.[field.name] : undefined
            const error = emailError ?? serverError
            const update = (value: string) => {
              setValues((previous) => ({ ...previous, [field.name]: value }))
              if (field.name === 'name' || field.name === 'website') setDuplicateReviewed(false)
            }
            const attributes = {
              id, name: field.name, required: field.required,
              'aria-invalid': Boolean(error) || undefined, 'aria-describedby': error ? id + '-error' : undefined,
            }
            let control
            switch (field.type) {
              case 'company':
                control = <CompanyPicker name={field.name} id={id} initial={company} invalid={Boolean(error)}
                  describedBy={attributes['aria-describedby']} />
                break
              case 'select':
                control = <NativeSelect {...attributes} value={value} onChange={(event) => update(event.target.value)}>
                  {field.options?.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </NativeSelect>
                break
              case 'textarea':
                control = <Textarea {...attributes} value={value} maxLength={field.max} onChange={(event) => update(event.target.value)} />
                break
              default:
                control = field.suggestions
                  ? <SuggestionInput {...attributes} label={field.label} value={value} onChange={update}
                    maxLength={field.max} suggestions={field.suggestions} />
                  : <Input {...attributes} className="h-10" type={field.type === 'url' ? 'text' : (field.type ?? 'text')}
                    inputMode={field.type === 'url' ? 'url' : undefined} value={value} maxLength={field.max}
                    autoCapitalize={email ? 'none' : undefined} spellCheck={email ? false : undefined}
                    onBlur={email ? () => setCheckedEmails((checked) => ({ ...checked, [field.name]: true })) : undefined}
                    onChange={(event) => update(event.target.value)} />
            }
            return <div key={field.name} className={`grid min-w-0 content-start gap-1.5 ${field.wide ? 'sm:col-span-2' : ''}`}>
              <label htmlFor={id} className="text-sm font-medium">{field.label}
                {field.required && <span className="text-muted-foreground"> (required)</span>}
              </label>
              {control}
              {error && <p id={id + '-error'} className="text-sm text-error">{error}</p>}
            </div>
          })}
        </CardContent>
      </Card>)}
      {state.message && (!state.duplicates || showDuplicates) && <AdminFeedback tone={showDuplicates || state.reload ? 'warning' : 'error'}>
        <p>{state.message}</p>
        {showDuplicates && <ul className="mt-2 grid gap-1">
          {state.duplicates?.map((match) => <li key={match.id}>
            <Link className="font-medium underline" href={`/admin/companies/${match.id}`} target="_blank" rel="noopener">
              {[match.name, match.website, match.country].filter(Boolean).join(' · ')}
            </Link>
          </li>)}
        </ul>}
      </AdminFeedback>}
      <div className="flex flex-wrap items-center gap-2">
        {state.reload ? <Button type="button" onClick={() => window.location.reload()}>Reload record</Button>
          : <Button type="submit" size="lg" name={showDuplicates ? 'confirmDuplicate' : undefined}
            value={showDuplicates ? 'yes' : undefined}>
            {pending ? 'Saving…' : showDuplicates ? 'Save anyway' : submitLabel}
          </Button>}
        <Button variant="outline" asChild size="lg"><Link href={cancel}>Cancel</Link></Button>
      </div>
    </fieldset>
  </form>
}
