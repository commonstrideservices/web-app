'use client'

import { Button } from '@/components/ui/button'
import { AdminFeedback } from '@/features/admin/components/admin-status'

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto grid max-w-lg gap-4 px-5 py-14">
      <h1 className="font-heading text-3xl font-bold">The admin page couldn’t load</h1>
      <AdminFeedback tone="error">Try again in a moment.</AdminFeedback>
      <div><Button onClick={reset}>Try again</Button></div>
    </main>
  )
}
