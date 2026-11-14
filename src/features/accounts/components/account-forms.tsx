'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { staffRoles, staffRoleLabels } from '../model'
import { UserServerAction } from '../user-server-action'

export function LoginForm({ configured }: { configured: boolean }) {
  const [result, action, pending] = useActionState(UserServerAction.signIn, { message: '' })
  return <form action={action} className="grid gap-4">
    <label className="grid gap-2 text-sm font-medium">Username
      <Input name="username" autoComplete="username" autoCapitalize="none" required maxLength={32} />
    </label>
    <label className="grid gap-2 text-sm font-medium">Password
      <Input name="password" type="password" autoComplete="current-password" required maxLength={72} />
    </label>
    {result.message && <p role="alert" className="text-sm text-destructive">{result.message}</p>}
    <Button type="submit" className="mt-1 w-full" disabled={pending || !configured}>{pending ? 'Signing in…' : 'Sign in'}</Button>
  </form>
}

function StaffCredentialFields({ ownAccount = false }: { ownAccount?: boolean }) {
  return <>
    <label className="grid gap-2 text-sm font-medium">Username
      <Input name="username" minLength={3} maxLength={32} autoComplete={ownAccount ? 'username' : 'off'} autoCapitalize="none" required />
    </label>
    <label className="grid gap-2 text-sm font-medium">{ownAccount ? 'Email' : 'Staff email'}
      <Input name="email" type="email" autoCapitalize="none" maxLength={254} required onChange={(event) => {
        const input = event.currentTarget
        input.value = input.value.toLowerCase()
      }} />
    </label>
    <label className="grid gap-2 text-sm font-medium">{ownAccount ? 'Password' : 'Initial password'}
      <Input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={72} required />
    </label>
  </>
}

export function AdministratorSetupForm() {
  const [result, action, pending] = useActionState(UserServerAction.setupAdministrator, { message: '' })
  return <form action={action} className="grid gap-4">
    <label className="grid gap-2 text-sm font-medium">Setup code
      <Input name="code" type="password" autoComplete="off" spellCheck={false} required />
    </label>
    <StaffCredentialFields ownAccount />
    <label className="grid gap-2 text-sm font-medium">Confirm password
      <Input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={72} required />
    </label>
    {result.message && <p role="alert" className="text-sm text-destructive">{result.message}</p>}
    <Button type="submit" className="mt-1 w-full" disabled={pending}>{pending ? 'Creating administrator…' : 'Create administrator'}</Button>
  </form>
}

export function CreateStaffForm() {
  const [result, action, pending] = useActionState(UserServerAction.createAccount, { message: '' })
  return <form action={action} className="grid gap-4 sm:grid-cols-2">
    <StaffCredentialFields />
    <label className="grid gap-2 text-sm font-medium">Role
      <select name="role" className="admin-field" defaultValue="staff">
        {staffRoles.map((role) => <option key={role} value={role}>{staffRoleLabels[role]}</option>)}
      </select>
    </label>
    {result.message && <p role={result.ok ? 'status' : 'alert'} className={`text-sm sm:col-span-2 ${result.ok ? 'text-foreground' : 'text-destructive'}`}>{result.message}</p>}
    <div className="sm:col-span-2"><Button disabled={pending} type="submit">{pending ? 'Creating account…' : 'Create account'}</Button></div>
  </form>
}
