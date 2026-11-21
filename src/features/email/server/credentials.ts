import 'server-only'

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { EmailError } from './access'

const currentKeyVersion = 1

function emailKey() {
  const secret = process.env.EMAIL_ENCRYPTION_KEY ?? ''
  const key = /^[A-Za-z0-9+/]{43}=$/.test(secret) ? Buffer.from(secret, 'base64') : null
  if (!key || key.length !== 32) throw new EmailError('Email encryption is unavailable. Set EMAIL_ENCRYPTION_KEY on the server.')
  return key
}

const passwordContext = (mailboxId: string) => Buffer.from(`common-stride:mailbox:${mailboxId.toLowerCase()}`)

export function encryptMailboxPassword(mailboxId: string, password: string) {
  const nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', emailKey(), nonce)
  cipher.setAAD(passwordContext(mailboxId))
  const ciphertext = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()])
  return {
    encrypted_password: Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]).toString('base64'),
    key_version: currentKeyVersion,
  }
}

export function decryptMailboxPassword(mailboxId: string, encrypted: string, version: number) {
  const key = emailKey()
  if (version !== currentKeyVersion) throw new EmailError('This mailbox uses an unavailable encryption key.')
  try {
    const value = Buffer.from(encrypted, 'base64')
    const decipher = createDecipheriv('aes-256-gcm', key, value.subarray(0, 12))
    decipher.setAAD(passwordContext(mailboxId))
    decipher.setAuthTag(value.subarray(12, 28))
    return Buffer.concat([decipher.update(value.subarray(28)), decipher.final()]).toString('utf8')
  } catch {
    throw new EmailError('The mailbox password could not be opened. Re-enter it in App Configuration.')
  }
}

