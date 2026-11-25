import { api } from '@/lib/api'

export type JoinExchangeOption = {
  id: string
  name: string
  exchangeDate: string | null
  minimumBudget: number | null
  maximumBudget: number | null
  ready: boolean
  participantName: string
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

/** Accepts a bare invite code or a full invite URL containing ?code=. */
export function normalizeInviteCode(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    const fromQuery = url.searchParams.get('code')
    if (fromQuery) {
      const code = fromQuery.replace(/[\s-]/g, '').toUpperCase()
      return INVITE_CODE_PATTERN.test(code) ? code : null
    }
  } catch {
    // Not a URL — treat as a bare code.
  }

  const code = trimmed.replace(/[\s-]/g, '').toUpperCase()
  return INVITE_CODE_PATTERN.test(code) ? code : null
}

export async function listExchangesForPhone(
  phone: string,
  code?: string | null,
): Promise<JoinExchangeOption[]> {
  const result = await api<{ exchanges: JoinExchangeOption[] }>('/api/join', {
    body: { action: 'list', phone, ...(code ? { code } : {}) },
    auth: false,
  })
  return result.exchanges
}

export async function revealAssignment(options: {
  phone: string
  groupId?: string
  code?: string | null
}): Promise<ParticipantAssignment> {
  const result = await api<{ assignment: ParticipantAssignment }>('/api/join', {
    body: {
      action: 'reveal',
      phone: options.phone,
      ...(options.groupId ? { groupId: options.groupId } : {}),
      ...(options.code ? { code: options.code } : {}),
    },
    auth: false,
  })
  return result.assignment
}
