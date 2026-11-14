import { z } from 'zod'

export const staffRoles = ['staff', 'admin'] as const
export const staffRoleLabels = { staff: 'Staff', admin: 'Administrator' } as const

const username = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9._-]{2,31}$/)
export const loginSchema = z.object({ username, password: z.string().min(1).max(72) })
const accountCredentials = z.object({
  username,
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(12).refine((value) => new TextEncoder().encode(value).length <= 72),
})

export const accountSchema = accountCredentials.extend({ role: z.enum(staffRoles) })

export const administratorSetupSchema = accountCredentials.extend({
  code: z.string().trim().regex(/^[A-Za-z0-9_-]{43}$/),
  confirmPassword: z.string().max(72),
}).refine((input) => input.password === input.confirmPassword, { path: ['confirmPassword'] })
