import { cloneElement, useId, type ComponentProps, type ReactElement } from 'react'
import { cn } from '@/lib/utils'

export function Field({ label, help, children }: {
  label: string
  help?: string
  children: ReactElement<{ id?: string; 'aria-describedby'?: string }>
}) {
  const id = useId()
  const helpId = help ? `${id}-help` : undefined
  return <div className="grid min-w-0 content-start gap-1.5 text-sm font-medium">
    <label htmlFor={id}>{label}</label>
    {cloneElement(children, { id, 'aria-describedby': helpId })}
    {help && <p id={helpId} className="text-xs font-normal text-muted-foreground">{help}</p>}
  </div>
}

const fieldStyle = 'w-full min-w-0 rounded-md border border-input bg-background text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50'

export function MailSelect({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(fieldStyle, 'h-10 px-2.5 text-sm', className)} {...props} />
}

export function MailTextarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(fieldStyle, 'min-h-32 resize-y px-3 py-2 text-base md:text-sm', className)} {...props} />
}


