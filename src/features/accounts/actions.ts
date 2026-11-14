'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { allowRequest } from '@/lib/rate-limit'
import { accountSchema, administratorSetupSchema, loginSchema } from './model'
import { provisionStaffAccount, signInStaff, staffSignInConfigured } from './server/account-service'
import { endStaffSession, getStaff } from './server/session-service'
import { createFirstAdministrator } from './server/setup-service'

type FormResult = { ok?: boolean; message: string }

export async function signIn(_previous: FormResult, form: FormData): Promise<FormResult> {
  if (!staffSignInConfigured()) return { message: 'Staff sign-in is temporarily unavailable.' }
  const result = loginSchema.safeParse({ username: form.get('username'), password: form.get('password') })
  if (!result.success) return { message: 'Enter a valid username and password.' }

  try {
    if (!await allowRequest('login', result.data.username, { perIdentity: 10, perNetwork: 80 })) {
      return { message: 'Too many attempts. Try again in a few minutes.' }
    }
    if (!await signInStaff(result.data)) return { message: 'The username or password is incorrect.' }
  } catch {
    return { message: 'Sign-in is temporarily unavailable. Try again shortly.' }
  }

  redirect('/admin')
}

export async function signOut() {
  await endStaffSession()
  redirect('/admin/login')
}

export async function setupAdministrator(_previous: FormResult, form: FormData): Promise<FormResult> {
  const input = administratorSetupSchema.safeParse({
    code: form.get('code'), username: form.get('username'), email: form.get('email'),
    password: form.get('password'), confirmPassword: form.get('confirmPassword'),
  })
  if (!input.success) {
    const fields = input.error.flatten().fieldErrors
    if (fields.code) return { message: 'Enter the setup code from your terminal.' }
    if (fields.confirmPassword) return { message: 'The passwords must match.' }
    return { message: 'Check your username, email, and password. Use a password with at least 12 characters and at most 72 bytes.' }
  }

  try {
    const result = await createFirstAdministrator(input.data)
    if (result === 'invalid-code') return { message: 'The setup code is invalid or expired. Run npm run admin:setup to get a new code.' }
    if (result === 'conflict') return { message: 'Choose a username and email that are available.' }
  } catch {
    return { message: 'Setup is temporarily unavailable. Try again shortly.' }
  }

  redirect('/admin/login')
}

export async function createAccount(_previous: FormResult, form: FormData): Promise<FormResult> {
  try {
    const actor = await getStaff()
    if (actor?.role !== 'admin') return { message: 'Only administrators can create staff accounts.' }

    const result = accountSchema.safeParse({
      username: form.get('username'), email: form.get('email'),
      password: form.get('password'), role: form.get('role'),
    })
    if (!result.success) {
      return { message: 'Check the username, email, role, and password. Use 3–32 characters for the username and at least 12 for the password.' }
    }
    if (!await provisionStaffAccount(result.data)) {
      return { message: 'The account could not be created. Check that the username and email are available.' }
    }
  } catch {
    return { message: 'The account could not be created. Try again shortly.' }
  }

  revalidatePath('/admin/accounts')
  return { ok: true, message: 'Staff account created.' }
}
