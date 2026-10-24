import { getMeta, setMeta } from '../db/schema'

// PIN 只防旁人偷看：IndexedDB 本身沒有加密，懂開發者工具的人仍能讀到資料

interface PinRecord {
  salt: string
  hash: string
  iterations: number
}

const enc = new TextEncoder()
const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function derive(pin: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256)
  return b64(bits)
}

export async function hasPin() {
  return !!(await getMeta<PinRecord | null>('pin', null))
}

export async function setPin(pin: string | null) {
  if (!pin) return setMeta('pin', null)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iterations = 150_000
  return setMeta('pin', { salt: b64(salt), hash: await derive(pin, salt, iterations), iterations })
}

export async function verifyPin(pin: string) {
  const rec = await getMeta<PinRecord | null>('pin', null)
  if (!rec) return true
  return (await derive(pin, unb64(rec.salt), rec.iterations)) === rec.hash
}
