/** Normalize to digits; strip leading US country code when 11 digits. */
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1)
  }
  return digits
}

/** Convert to E.164 for US numbers when possible. */
export function toE164(phone: string): string | null {
  const digits = normalizePhone(phone)
  if (digits.length === 10) return `+1${digits}`
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`
  return null
}
