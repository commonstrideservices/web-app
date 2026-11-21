import Form from 'next/form'
import Link from 'next/link'
import { ArrowDown, ArrowDownUp, ArrowUp, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Pagination } from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { directoryUrl, pageSizes, type DirectoryQuery } from '../directory'
import { PageSizeSelect } from './page-size-select'

type Column<Row> = {
  id: string
  label: string
  sort?: string
  cell: (row: Row) => ReactNode
}

export function DirectoryFilter({ name, label, value, options }: {
  name: string; label: string; value?: string; options: { value: string; label: string }[]
}) {
  const selectedMissing = value && !options.some((option) => option.value === value)
  return <label className="grid min-w-0 gap-1.5 text-sm font-medium sm:w-34">
    {label}
    <NativeSelect name={name} defaultValue={value ?? ''}>
      <option value="">All</option>
      {selectedMissing && <option value={value}>{value}</option>}
      {options.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
    </NativeSelect>
  </label>
}

export function DataTable<Row extends { id: string }, Query extends DirectoryQuery>({
  pathname, label, searchPlaceholder, query, fixedQuery = {}, filters, columns, rows, total, emptyMessage,
}: {
  pathname: string; label: string; searchPlaceholder: string; query: Query;
  fixedQuery?: Record<string, string>;
  filters?: ReactNode; columns: Column<Row>[]; rows: Row[]; total: number; emptyMessage: string
}) {
  const pages = Math.max(1, Math.ceil(total / query.size))
  const state = { ...query, ...fixedQuery }
  const filterUrl = directoryUrl(pathname, state)
  const first = total ? (query.page - 1) * query.size + 1 : 0
  const last = Math.min(query.page * query.size, total)
  const range = first === last ? String(first) : `${first}–${last}`

  return <div className="grid min-w-0 gap-4">
    <Card className="py-4">
      <CardContent className="px-4">
        <Form key={filterUrl} action={pathname} scroll={false} className="flex flex-wrap items-end gap-3">
          {Object.entries(fixedQuery).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
          <input type="hidden" name="sort" value={query.sort} />
          <input type="hidden" name="direction" value={query.direction} />
          <input type="hidden" name="size" value={query.size} />
          <label className="grid w-full gap-1.5 text-sm font-medium sm:max-w-56">
            Search
            <span className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-10 ps-9" type="search" name="q" defaultValue={query.q} maxLength={150} placeholder={searchPlaceholder} />
            </span>
          </label>
          {filters && <div className="grid w-full grid-cols-2 gap-3 sm:contents">{filters}</div>}
          <div className="flex gap-2">
            <Button type="submit" size="lg">Apply</Button>
            <Button asChild variant="ghost" size="lg"><Link href={directoryUrl(pathname, fixedQuery)} scroll={false}>Clear</Link></Button>
          </div>
        </Form>
      </CardContent>
    </Card>
    <Card className="min-w-0 gap-0 py-0">
      <div aria-label={`${label} table`} role="region" tabIndex={0} className="overflow-x-auto rounded-t-xl outline-ring">
        <Table aria-label={label}>
          <TableHeader>
            <TableRow>
              {columns.map(({ id, label, sort }) => {
                const active = Boolean(sort && sort === query.sort)
                const direction = active && query.direction === 'asc' ? 'desc' : 'asc'
                const SortIcon = active ? (query.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowDownUp
                return <TableHead key={id} aria-sort={active ? (query.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {sort ? <Button variant="ghost" size="sm" className="-ms-2" asChild>
                    <Link href={directoryUrl(pathname, state, { sort, direction, page: 1 })} scroll={false}>
                      {label}<SortIcon aria-hidden="true" className="size-3.5" />
                    </Link>
                  </Button> : label}
                </TableHead>
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? rows.map((row) => <TableRow key={row.id}>
              {columns.map(({ id, cell }) => <TableCell key={id}>{cell(row)}</TableCell>)}
            </TableRow>) : <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">{emptyMessage}</TableCell>
            </TableRow>}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
        <p className="tabular-nums">
          {total ? `${range} of ${total.toLocaleString('en-PH')}` : '0 results'}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <PageSizeSelect size={query.size} options={pageSizes.map((size) => ({
            size, href: directoryUrl(pathname, state, { size, page: 1 }),
          }))} />
          <Pagination page={query.page} pages={pages}
            previous={query.page > 1 ? directoryUrl(pathname, state, { page: query.page - 1 }) : undefined}
            next={query.page < pages ? directoryUrl(pathname, state, { page: query.page + 1 }) : undefined} />
        </div>
      </div>
    </Card>
  </div>
}
