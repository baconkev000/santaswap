import { ref } from 'vue'
import type { MatchGroupDraft } from '@/components/MatchGroupsEditor.vue'
import { emptyDetailsDraft, type ExchangeDetailsDraft } from '@/utils/exchangeForm'
import type { ParticipantInput } from '@/utils/exchangeRules'

export type DraftParticipant = ParticipantInput & { id: string }

type DraftState = {
  details: ExchangeDetailsDraft
  participants: DraftParticipant[]
  matchGroups: MatchGroupDraft[]
  preventWithinGroupMatches: boolean
  allowDoubleGifts: boolean
  nextId: number
}

const STORAGE_KEY = 'santaswap.create-draft'

const details = ref<ExchangeDetailsDraft>(emptyDetailsDraft())
const participants = ref<DraftParticipant[]>([])
const matchGroups = ref<MatchGroupDraft[]>([])
const preventWithinGroupMatches = ref(false)
const allowDoubleGifts = ref(false)
let nextId = 0
let hydrated = false

function readStored(): DraftState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DraftState
  } catch {
    return null
  }
}

function persist() {
  try {
    const state: DraftState = {
      details: details.value,
      participants: participants.value,
      matchGroups: matchGroups.value,
      preventWithinGroupMatches: preventWithinGroupMatches.value,
      allowDoubleGifts: allowDoubleGifts.value,
      nextId,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private mode — draft only lasts for this page session in memory.
  }
}

function hydrate() {
  if (hydrated) return
  hydrated = true
  const stored = readStored()
  if (!stored) return
  details.value = { ...emptyDetailsDraft(), ...stored.details }
  participants.value = stored.participants ?? []
  matchGroups.value = stored.matchGroups ?? []
  preventWithinGroupMatches.value = Boolean(stored.preventWithinGroupMatches)
  allowDoubleGifts.value = Boolean(stored.allowDoubleGifts)
  nextId = Number(stored.nextId) || participants.value.length
}

export function useCreateExchangeDraft() {
  hydrate()

  function save() {
    persist()
  }

  function clear() {
    details.value = emptyDetailsDraft()
    participants.value = []
    matchGroups.value = []
    preventWithinGroupMatches.value = false
    allowDoubleGifts.value = false
    nextId = 0
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  function addParticipant(input: ParticipantInput) {
    participants.value.push({
      id: `draft-${nextId++}`,
      name: input.name.trim(),
      phoneNumber: input.phoneNumber.trim(),
    })
    persist()
  }

  function removeParticipant(id: string) {
    participants.value = participants.value.filter((p) => p.id !== id)
    matchGroups.value = matchGroups.value
      .map((group) => ({
        ...group,
        participantIds: group.participantIds.filter((participantId) => participantId !== id),
      }))
      .filter((group) => group.participantIds.length > 0)
    persist()
  }

  return {
    details,
    participants,
    matchGroups,
    preventWithinGroupMatches,
    allowDoubleGifts,
    save,
    clear,
    addParticipant,
    removeParticipant,
  }
}
