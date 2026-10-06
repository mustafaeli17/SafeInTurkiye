import { createHmac, timingSafeEqual } from 'node:crypto'
export function photoSignature(name: string, expires: number, key: string) {
  return createHmac('sha256', key).update(`${name}:${expires}`).digest('hex')
}
export function validPhotoToken(name: string, expires: number, signature: string, key: string) {
  if (!/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(name) || name.length > 2500 || !Number.isSafeInteger(expires) || expires < Date.now() || expires > Date.now() + 16 * 60000 || !/^[a-f0-9]{64}$/.test(signature)) return false
  return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(photoSignature(name, expires, key), 'hex'))
}
