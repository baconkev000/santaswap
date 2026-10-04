import type { ExchangeDetailsInput } from '@/services/exchanges'
import { parseBudget, validateBudget } from '@/utils/exchangeRules'

export type ExchangeDetailsDraft = {
  name: string
  exchangeDate: string
  minimumBudget: string
  maximumBudget: string
}

export function emptyDetailsDraft(): ExchangeDetailsDraft {
  return { name: '', exchangeDate: '', minimumBudget: '', maximumBudget: '' }
}

export function draftFromDetails(details: {
  name: string
  exchangeDate: string | null
  minimumBudget: number | null
  maximumBudget: number | null
}): ExchangeDetailsDraft {
  return {
    name: details.name,
    exchangeDate: details.exchangeDate ?? '',
    minimumBudget: details.minimumBudget != null ? String(details.minimumBudget) : '',
    maximumBudget: details.maximumBudget != null ? String(details.maximumBudget) : '',
  }
}

export type ParsedDetails =
  | { ok: true; details: ExchangeDetailsInput }
  | { ok: false; field: 'name' | 'budget'; error: string }

export function parseDetailsDraft(draft: ExchangeDetailsDraft): ParsedDetails {
  if (!draft.name.trim()) return { ok: false, field: 'name', error: 'Exchange name is required.' }
  const minimumBudget = parseBudget(draft.minimumBudget)
  const maximumBudget = parseBudget(draft.maximumBudget)
  const budgetError = validateBudget(minimumBudget, maximumBudget)
  if (budgetError) return { ok: false, field: 'budget', error: budgetError }
  return {
    ok: true,
    details: {
      name: draft.name,
      exchangeDate: draft.exchangeDate,
      minimumBudget,
      maximumBudget,
    },
  }
}
