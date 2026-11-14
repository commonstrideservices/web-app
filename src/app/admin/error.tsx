'use client'

import { Button } from '@/components/ui/button'

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto grid max-w-lg gap-4 px-5 py-14">
      <h1 className="font-heading text-3xl font-bold">The admin page couldn’t load</h1>
      <p className="text-sm text-muted-foreground">Try again in a moment.</p>
      <div><Button onClick={reset}>Try again</Button></div>
    </main>
  )
}
