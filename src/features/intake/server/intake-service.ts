import 'server-only'

import { sql } from 'drizzle-orm'
import type { z } from 'zod'
import { getDatabase } from '@/lib/db/server'
import type { answerSnapshotSchema } from '../model'

export async function saveInitialIntake(input: {
  submissionId: string; email: string; name: string; companyName: string; phone: string
  version: number; answers: z.infer<typeof answerSnapshotSchema>
}) {
  await getDatabase().execute(sql`
    select public.submit_initial_intake(
      ${input.submissionId}::uuid, ${input.email}::text, ${input.name}::text,
      ${input.companyName}::text, ${input.phone}::text, ${input.version}::integer,
      ${JSON.stringify(input.answers)}::text::jsonb
    )
  `)
}
