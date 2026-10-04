import { invokeFunction } from '@/lib/functions'

export type JoinGroupInfo = {
  name: string
  exchangeDate: string | null
  minimumBudget: number | null
  maximumBudget: number | null
  ready: boolean
}

export type ParticipantAssignment = {
  participantName: string
  groupName: string
  recipients: string[]
  exchangeDate: string | null
  minimumBudget: number | null
  maximumBudget: number | null
  budgetMode: 'full' | 'split'
}

const INVITE_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{10}$/

export function normalizeInviteCode(value: string): string | null {
  const code = value.replace(/[\s-]/g, '').toUpperCase()
  return INVITE_CODE_PATTERN.test(code) ? code : null
}

export async function lookupExchange(code: string): Promise<JoinGroupInfo> {
  const result = await invokeFunction<{ group: JoinGroupInfo }>('join-exchange', {
    action: 'lookup',
    code,
  })
  return result.group
}

export async function requestVerificationCode(
  code: string,
  phone: string,
): Promise<{ expiresInSeconds: number; resendAfterSeconds: number }> {
  return invokeFunction('join-exchange', { action: 'request-code', code, phone })
}

export async function verifyPhone(
  code: string,
  phone: string,
  verificationCode: string,
): Promise<{ sessionToken: string; expiresAt: string }> {
  return invokeFunction('join-exchange', { action: 'verify', code, phone, verificationCode })
}

export async function fetchAssignment(sessionToken: string): Promise<ParticipantAssignment> {
  const result = await invokeFunction<{ assignment: ParticipantAssignment }>('join-exchange', {
    action: 'assignment',
    sessionToken,
  })
  return result.assignment
}

// The short-lived session token is kept per tab (sessionStorage) so a refresh
// doesn't force re-verification. The assignment itself is never stored.
const storageKey = (code: string) => `santaswap.join.${code}`

export function loadParticipantSession(code: string): string | null {
  try {
    const raw = sessionStorage.getItem(storageKey(code))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: string; expiresAt?: string }
    if (!parsed.token || !parsed.expiresAt || Date.parse(parsed.expiresAt) <= Date.now()) {
      sessionStorage.removeItem(storageKey(code))
      return null
    }
    return parsed.token
  } catch {
    return null
  }
}

export function saveParticipantSession(code: string, token: string, expiresAt: string): void {
  try {
    sessionStorage.setItem(storageKey(code), JSON.stringify({ token, expiresAt }))
  } catch {
    // Storage unavailable (private mode); the session just won't survive a refresh.
  }
}

export function clearParticipantSession(code: string): void {
  try {
    sessionStorage.removeItem(storageKey(code))
  } catch {
    // ignore
  }
}
