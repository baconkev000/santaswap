// Field rules shared with the SantaSwap mobile app (src/utils/formatters.ts and
// SantaSwapContext validation). Assignment generation lives only on the server.

export type ExchangeStatus = 'draft' | 'ready_to_draw' | 'drawn' | 'sending' | 'complete'

export const SANTASWAP_JOIN_URL = 'https://santaswap.us/join'

export function buildGroupInviteUrl(inviteCode: string): string {
  return `${SANTASWAP_JOIN_URL}?code=${encodeURIComponent(inviteCode.trim())}`
}

/** Digits only; strips a leading US country code when 11 digits. */
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1)
  return digits
}

export function toE164(phone: string): string | null {
  const digits = normalizePhone(phone)
  if (digits.length === 10) return `+1${digits}`
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`
  return null
}

export function parseBudget(value: string): number | undefined {
  const trimmed = value.trim().replace(/^\$/, '')
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

export function validateBudget(minimum?: number, maximum?: number): string | null {
  if (Number.isNaN(minimum) || Number.isNaN(maximum)) return 'Budgets must be numbers.'
  if ((minimum ?? 0) < 0 || (maximum ?? 0) < 0) return 'Budgets cannot be negative.'
  if (minimum != null && maximum != null && minimum > maximum) {
    return 'Minimum budget cannot be greater than maximum budget.'
  }
  return null
}

export type ParticipantInput = { name: string; phoneNumber: string }

export function validateParticipant(
  input: ParticipantInput,
  existing: Array<{ id?: string; phoneNumber: string }>,
  excludeId?: string,
): string | null {
  if (!input.name.trim()) return 'Name is required.'
  if (!input.phoneNumber.trim()) return 'Phone number is required.'
  if (!toE164(input.phoneNumber)) return 'Enter a valid phone number, including area code.'
  const normalized = normalizePhone(input.phoneNumber)
  if (existing.some((p) => p.id !== excludeId && normalizePhone(p.phoneNumber) === normalized)) {
    return 'This person is already in the exchange'
  }
  return null
}

export function statusForParticipantCount(count: number): ExchangeStatus {
  return count >= 2 ? 'ready_to_draw' : 'draft'
}

export function isDrawn(status: ExchangeStatus): boolean {
  return status === 'drawn' || status === 'sending' || status === 'complete'
}

export function formatStatusLabel(status: ExchangeStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'ready_to_draw':
      return 'Ready to draw'
    default:
      return 'Names drawn'
  }
}

export function formatBudgetRange(minimum?: number | null, maximum?: number | null): string | undefined {
  if (minimum == null && maximum == null) return undefined
  if (minimum != null && maximum != null) return `$${minimum}–$${maximum}`
  if (minimum != null) return `Min $${minimum}`
  return `Max $${maximum}`
}

export function formatParticipantCount(count: number): string {
  return count === 1 ? '1 participant' : `${count} participants`
}
