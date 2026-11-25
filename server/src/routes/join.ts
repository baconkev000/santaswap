import { Router } from 'express'
import { hmacHex } from '../lib/crypto.js'
import { normalizePhone, toE164 } from '../lib/phone.js'
import { query } from '../db.js'
import { env } from '../env.js'
import { jsonError, jsonOk } from '../http.js'

const INVITE_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{10}$/
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const READY_STATUSES = new Set(['drawn', 'sending', 'complete'])

const REVEAL_WINDOW_MS = 15 * 60 * 1000
const MAX_REVEALS_PER_PHONE_GROUP_WINDOW = 10
const MAX_REVEALS_PER_PHONE_HOUR = 30
const MAX_REVEALS_PER_GROUP_HOUR = 120
const MAX_LISTS_PER_PHONE_HOUR = 20
const ATTEMPT_RETENTION_MS = 24 * 60 * 60 * 1000

type GroupRow = {
  id: string
  name: string
  invite_code: string
  exchange_date: string | null
  minimum_budget: string | number | null
  maximum_budget: string | number | null
  double_gift_budget_mode: 'full' | 'split'
  status: string
}

function normalizeInviteCode(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const code = value.replace(/[\s-]/g, '').toUpperCase()
  return INVITE_CODE_PATTERN.test(code) ? code : null
}

function sinceIso(ms: number): string {
  return new Date(Date.now() - ms).toISOString()
}

function publicExchange(group: GroupRow) {
  return {
    id: group.id,
    name: group.name,
    exchangeDate: group.exchange_date,
    minimumBudget: group.minimum_budget == null ? null : Number(group.minimum_budget),
    maximumBudget: group.maximum_budget == null ? null : Number(group.maximum_budget),
    ready: READY_STATUSES.has(group.status),
  }
}

async function findGroupByCode(code: string): Promise<GroupRow | null> {
  const result = await query<GroupRow>(
    `select id, name, invite_code, exchange_date, minimum_budget, maximum_budget,
            double_gift_budget_mode, status
     from groups where invite_code = $1`,
    [code],
  )
  return result.rows[0] ?? null
}

async function findGroupById(id: string): Promise<GroupRow | null> {
  const result = await query<GroupRow>(
    `select id, name, invite_code, exchange_date, minimum_budget, maximum_budget,
            double_gift_budget_mode, status
     from groups where id = $1`,
    [id],
  )
  return result.rows[0] ?? null
}

async function countAttempts(
  filters: { groupId?: string; phoneHash?: string },
  sinceMs: number,
): Promise<number> {
  const clauses = ['created_at >= $1']
  const params: unknown[] = [sinceIso(sinceMs)]
  if (filters.groupId) {
    params.push(filters.groupId)
    clauses.push(`group_id = $${params.length}`)
  }
  if (filters.phoneHash) {
    params.push(filters.phoneHash)
    clauses.push(`phone_hash = $${params.length}`)
  }
  const result = await query<{ count: string }>(
    `select count(*)::text as count from assignment_reveal_attempts where ${clauses.join(' and ')}`,
    params,
  )
  return Number(result.rows[0]?.count ?? 0)
}

async function enforceRevealLimits(groupId: string, phoneHash: string): Promise<boolean> {
  const [phoneGroupCount, phoneHourCount, groupHourCount] = await Promise.all([
    countAttempts({ groupId, phoneHash }, REVEAL_WINDOW_MS),
    countAttempts({ phoneHash }, 60 * 60 * 1000),
    countAttempts({ groupId }, 60 * 60 * 1000),
  ])
  return (
    phoneGroupCount < MAX_REVEALS_PER_PHONE_GROUP_WINDOW &&
    phoneHourCount < MAX_REVEALS_PER_PHONE_HOUR &&
    groupHourCount < MAX_REVEALS_PER_GROUP_HOUR
  )
}

export const joinRouter = Router()

joinRouter.post('/', async (req, res) => {
  try {
    const action = req.body?.action

    if (action === 'lookup') {
      const code = normalizeInviteCode(req.body?.code)
      if (!code) {
        return jsonError(
          res,
          'invalid_invite_code',
          "We couldn't find that exchange. Check your invite link and try again.",
          404,
        )
      }
      const group = await findGroupByCode(code)
      if (!group) {
        return jsonError(
          res,
          'invalid_invite_code',
          "We couldn't find that exchange. Check your invite link and try again.",
          404,
        )
      }
      return jsonOk(res, { ok: true, group: publicExchange(group) })
    }

    if (action === 'list') {
      const rawPhone = typeof req.body?.phone === 'string' ? req.body.phone : ''
      const e164 = toE164(rawPhone)
      const phoneNormalized = normalizePhone(rawPhone)
      if (!e164) {
        return jsonError(res, 'invalid_phone', 'Enter a valid mobile number, including area code.')
      }

      await query('delete from assignment_reveal_attempts where created_at < $1', [
        sinceIso(ATTEMPT_RETENTION_MS),
      ])

      const phoneHash = hmacHex(env.lookupSecret, `phone:${phoneNormalized}`)
      const phoneHourCount = await countAttempts({ phoneHash }, 60 * 60 * 1000)
      if (phoneHourCount >= MAX_LISTS_PER_PHONE_HOUR) {
        return jsonError(
          res,
          'too_many_requests',
          'Too many attempts. Please wait a bit and try again.',
          429,
        )
      }

      const matches = await query<GroupRow & { participant_name: string }>(
        `select g.id, g.name, g.invite_code, g.exchange_date, g.minimum_budget, g.maximum_budget,
                g.double_gift_budget_mode, g.status, p.name as participant_name
         from participants p
         join groups g on g.id = p.group_id
         where p.phone_normalized = $1
         order by g.updated_at desc`,
        [phoneNormalized],
      )

      await query(
        'insert into assignment_reveal_attempts (group_id, phone_hash) values ($1, $2)',
        [matches.rows[0]?.id ?? null, phoneHash],
      )

      const inviteCode = normalizeInviteCode(req.body?.code)
      let exchanges = matches.rows.map((row) => ({
        ...publicExchange(row),
        participantName: row.participant_name,
      }))
      if (inviteCode) {
        exchanges = exchanges.filter((row) => {
          const full = matches.rows.find((m) => m.id === row.id)
          return full?.invite_code === inviteCode
        })
      }

      if (!exchanges.length) {
        return jsonError(
          res,
          'no_match',
          "We couldn't find any exchanges for that phone number. Use the number your organizer saved for you.",
          404,
        )
      }

      return jsonOk(res, { ok: true, exchanges })
    }

    if (action === 'reveal') {
      const rawPhone = typeof req.body?.phone === 'string' ? req.body.phone : ''
      const e164 = toE164(rawPhone)
      const phoneNormalized = normalizePhone(rawPhone)
      if (!e164) {
        return jsonError(res, 'invalid_phone', 'Enter a valid mobile number, including area code.')
      }

      const groupId =
        typeof req.body?.groupId === 'string' && UUID_PATTERN.test(req.body.groupId)
          ? req.body.groupId
          : null
      const code = normalizeInviteCode(req.body?.code)

      let group: GroupRow | null = null
      if (groupId) group = await findGroupById(groupId)
      else if (code) group = await findGroupByCode(code)

      if (!group) {
        return jsonError(
          res,
          'invalid_invite_code',
          "We couldn't find that exchange. Please try again.",
          404,
        )
      }

      if (!READY_STATUSES.has(group.status)) {
        return jsonError(
          res,
          'not_ready',
          "Your organizer hasn't drawn names yet. Check back once the exchange is ready.",
          409,
        )
      }

      await query('delete from assignment_reveal_attempts where created_at < $1', [
        sinceIso(ATTEMPT_RETENTION_MS),
      ])

      const phoneHash = hmacHex(env.lookupSecret, `phone:${phoneNormalized}`)
      if (!(await enforceRevealLimits(group.id, phoneHash))) {
        return jsonError(
          res,
          'too_many_requests',
          'Too many attempts. Please wait 15 minutes and try again.',
          429,
        )
      }

      await query(
        'insert into assignment_reveal_attempts (group_id, phone_hash) values ($1, $2)',
        [group.id, phoneHash],
      )

      const participant = await query<{ id: string; name: string }>(
        `select id, name from participants
         where group_id = $1 and phone_normalized = $2`,
        [group.id, phoneNormalized],
      )
      const person = participant.rows[0]
      if (!person) {
        return jsonError(
          res,
          'no_match',
          "We couldn't find that phone number in this exchange. Use the number your organizer saved for you.",
          404,
        )
      }

      const assignmentRows = await query<{ recipient_id: string }>(
        `select recipient_id from assignments
         where group_id = $1 and giver_id = $2`,
        [group.id, person.id],
      )
      if (!assignmentRows.rowCount) {
        return jsonError(
          res,
          'no_match',
          "We couldn't find that phone number in this exchange. Use the number your organizer saved for you.",
          404,
        )
      }

      const recipients = await query<{ id: string; name: string }>(
        `select id, name from participants
         where group_id = $1 and id = any($2::uuid[])`,
        [group.id, assignmentRows.rows.map((r) => r.recipient_id)],
      )

      return jsonOk(res, {
        ok: true,
        assignment: {
          participantName: person.name,
          groupName: group.name,
          recipients: recipients.rows.map((r) => r.name),
          exchangeDate: group.exchange_date,
          minimumBudget: group.minimum_budget == null ? null : Number(group.minimum_budget),
          maximumBudget: group.maximum_budget == null ? null : Number(group.maximum_budget),
          budgetMode: group.double_gift_budget_mode,
        },
      })
    }

    return jsonError(res, 'invalid_request', 'Invalid request.')
  } catch (error) {
    console.error('[join]', error)
    return jsonError(res, 'server_error', 'Something went wrong. Please try again.', 500)
  }
})
