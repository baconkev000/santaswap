import { createHmac, timingSafeEqual } from 'node:crypto'

export function hmacHex(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('hex')
}

export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}
