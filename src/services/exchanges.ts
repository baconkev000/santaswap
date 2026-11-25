import { api, ApiError } from '@/lib/api'
import { type ExchangeStatus, type ParticipantInput } from '@/utils/exchangeRules'

export type MatchGroup = {
  id: string
  name: string
  participantIds: string[]
}

export type ExchangeSummary = {
  id: string
  name: string
  exchangeDate: string | null
  minimumBudget: number | null
  maximumBudget: number | null
  status: ExchangeStatus
  participantCount: number
}

export type Participant = { id: string; name: string; phoneNumber: string }

export type ExchangeDetail = ExchangeSummary & {
  inviteCode: string
  participants: Participant[]
  preventWithinGroupMatches: boolean
  allowDoubleGifts: boolean
  matchGroups: MatchGroup[]
}

export type ExchangeDetailsInput = {
  name: string
  exchangeDate?: string
  minimumBudget?: number
  maximumBudget?: number
}

export type CreateExchangeInput = ExchangeDetailsInput & {
  participants: Array<ParticipantInput & { id?: string }>
  preventWithinGroupMatches?: boolean
  allowDoubleGifts?: boolean
  matchGroups?: Array<{ name: string; participantIds: string[] }>
}

function fail(error: unknown, fallback: string): never {
  if (error instanceof ApiError) {
    if (error.code === 'duplicate_phone') throw new Error('This person is already in the exchange')
    throw new Error(error.message || fallback)
  }
  throw new Error(fallback)
}

export async function listExchanges(): Promise<ExchangeSummary[]> {
  try {
    const result = await api<{ exchanges: ExchangeSummary[] }>('/api/exchanges')
    return result.exchanges
  } catch (error) {
    fail(error, "Couldn't load your exchanges. Please try again.")
  }
}

export type OrganizerAssignment = {
  giverId: string
  giverName: string
  recipients: string[]
}

export async function getExchange(id: string): Promise<ExchangeDetail | null> {
  try {
    const result = await api<{ exchange: ExchangeDetail }>(`/api/exchanges/${id}`)
    return result.exchange
  } catch (error) {
    if (error instanceof ApiError && error.code === 'not_found') return null
    fail(error, "Couldn't load this exchange. Please try again.")
  }
}

export async function getOrganizerAssignments(
  id: string,
): Promise<{ drawn: boolean; assignments: OrganizerAssignment[] }> {
  try {
    return await api(`/api/exchanges/${id}/assignments`)
  } catch (error) {
    fail(error, "Couldn't load assignments. Please try again.")
  }
}

export async function createExchange(input: CreateExchangeInput): Promise<string> {
  try {
    const result = await api<{ id: string }>('/api/exchanges', { body: input })
    return result.id
  } catch (error) {
    fail(error, "Couldn't create your exchange. Please try again.")
  }
}

export async function updateExchangeDetails(id: string, details: ExchangeDetailsInput): Promise<void> {
  try {
    await api(`/api/exchanges/${id}`, { method: 'PATCH', body: details })
  } catch (error) {
    fail(error, "Couldn't save your changes. Please try again.")
  }
}

export async function updateMatchSettings(
  id: string,
  settings: { preventWithinGroupMatches?: boolean; allowDoubleGifts?: boolean },
): Promise<void> {
  try {
    await api(`/api/exchanges/${id}`, { method: 'PATCH', body: settings })
  } catch (error) {
    fail(error, "Couldn't save group settings. Please try again.")
  }
}

export async function saveMatchGroups(
  id: string,
  matchGroups: Array<{ name: string; participantIds: string[] }>,
): Promise<MatchGroup[]> {
  try {
    const result = await api<{ matchGroups: MatchGroup[] }>(`/api/exchanges/${id}/match-groups`, {
      method: 'PUT',
      body: { matchGroups },
    })
    return result.matchGroups
  } catch (error) {
    fail(error, "Couldn't save groups. Please try again.")
  }
}

export async function addParticipant(groupId: string, input: ParticipantInput): Promise<void> {
  try {
    await api(`/api/exchanges/${groupId}/participants`, { body: input })
  } catch (error) {
    fail(error, "Couldn't add this participant. Please try again.")
  }
}

export async function updateParticipant(
  groupId: string,
  id: string,
  input: ParticipantInput,
): Promise<void> {
  try {
    await api(`/api/exchanges/${groupId}/participants/${id}`, { method: 'PATCH', body: input })
  } catch (error) {
    fail(error, "Couldn't update this participant. Please try again.")
  }
}

export async function removeParticipant(groupId: string, id: string): Promise<void> {
  try {
    await api(`/api/exchanges/${groupId}/participants/${id}`, { method: 'DELETE' })
  } catch (error) {
    fail(error, "Couldn't remove this participant. Please try again.")
  }
}

export async function syncStatusAfterParticipantChange(
  _groupId: string,
  _participantCount: number,
): Promise<void> {
  // Status + assignment clearing happens on the API when participants change.
}

export async function drawExchange(
  groupId: string,
): Promise<{ participantCount: number; usedDoubleGifts: boolean }> {
  try {
    return await api(`/api/exchanges/${groupId}/draw`, { method: 'POST', body: {} })
  } catch (error) {
    fail(error, "Couldn't draw names. Please try again.")
  }
}

export async function deleteExchange(id: string): Promise<void> {
  try {
    await api(`/api/exchanges/${id}`, { method: 'DELETE' })
  } catch (error) {
    fail(error, "Couldn't delete this exchange. Please try again.")
  }
}
