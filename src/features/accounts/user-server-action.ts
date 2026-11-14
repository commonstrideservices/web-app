import { createAccount, setupAdministrator, signIn, signOut } from './actions'

export class UserServerAction {
  static readonly createAccount = createAccount
  static readonly setupAdministrator = setupAdministrator
  static readonly signIn = signIn
  static readonly signOut = signOut
}
