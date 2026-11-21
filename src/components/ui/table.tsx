import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Table({ className, ...props }: ComponentProps<'table'>) {
  return <table data-slot="table" className={cn('w-full caption-bottom text-sm', className)} {...props} />
}

export function TableHeader(props: ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className="[&_tr]:border-b" {...props} />
}

export function TableBody(props: ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className="[&_tr:last-child]:border-0" {...props} />
}

export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return <tr data-slot="table-row" className={cn('border-b transition-colors hover:bg-muted/50', className)} {...props} />
}

export function TableHead({ className, ...props }: ComponentProps<'th'>) {
  return <th data-slot="table-head" scope="col" className={cn('h-11 px-4 text-left align-middle font-medium whitespace-nowrap', className)} {...props} />
}

export function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return <td data-slot="table-cell" className={cn('px-4 py-3 align-middle', className)} {...props} />
}
