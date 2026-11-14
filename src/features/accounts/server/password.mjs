import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { compare } from 'bcryptjs'

const deriveKey = promisify(scrypt)
const options = { N: 2 ** 15, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }
const keyLength = 32
const scryptFormat = /^scrypt-v1\$([0-9a-f]{32})\$([0-9a-f]{64})$/
const bcryptFormat = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/

/** @param {string} password */
export async function hashPassword(password) {
  const salt = randomBytes(16)
  const key = await deriveKey(password, salt, keyLength, options)
  return `scrypt-v1$${salt.toString('hex')}$${key.toString('hex')}`
}

/** @param {string} password @param {string | null | undefined} hash */
export async function verifyPassword(password, hash) {
  if (hash && bcryptFormat.test(hash)) {
    const valid = Buffer.byteLength(password) <= 72 && await compare(password, hash)
    return { valid, needsUpgrade: valid }
  }

  const match = scryptFormat.exec(hash ?? '')
  // Spend the same work on an unknown username or missing credential.
  const salt = match ? Buffer.from(match[1], 'hex') : Buffer.alloc(16)
  const key = await deriveKey(password, salt, keyLength, options)
  const valid = Boolean(match && timingSafeEqual(key, Buffer.from(match[2], 'hex')))
  return { valid, needsUpgrade: false }
}
