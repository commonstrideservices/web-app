import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminThemeToggle } from '@/features/admin/components/admin-theme'
import { Brand } from '@/features/site/components/brand'

export function StaffAccessCard({ title, description, children }: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-center gap-5 px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3"><Brand compact /><AdminThemeToggle /></div>
      <Card>
        <CardHeader>
          <CardTitle><h1 className="font-heading text-3xl tracking-tight">{title}</h1></CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} aria-hidden="true" /> Back to website
      </Link>
    </main>
  )
}
