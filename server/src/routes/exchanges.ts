import { Router } from 'express'
import type pg from 'pg'
import { requireAuth } from '../auth.js'
import { generateAssignments, type Subgroup } from '../lib/assignments.js'
import { normalizePhone, toE164 } from '../lib/phone.js'
import { pool, query } from '../db.js'
import { jsonError, jsonOk } from '../http.js'

type ExchangeStatus = 'draft' | 'ready_to_draw' | 'drawn' | 'sending' | 'complete'

type MatchGroupInput = {
  name: string
  participantIds: string[]
}

function statusForParticipantCount(count: number): ExchangeStatus {
  return count >= 2 ? 'ready_to_draw' : 'draft'
}

function mapSummary(row: {
  id: string
  name: string
  exchange_date: string | null
  minimum_budget: string | number | null
  maximum_budget: string | number | null
  status: ExchangeStatus
  participant_count: string | number
}) {
  return {
    id: row.id,
    name: row.name,
    exchangeDate: row.exchange_date,
    minimumBudget: row.minimum_budget == null ? null : Number(row.minimum_budget),
    maximumBudget: row.maximum_budget == null ? null : Number(row.maximum_budget),
    status: row.status,
    participantCount: Number(row.participant_count),
  }
}

function parseMatchGroups(raw: unknown): MatchGroupInput[] | { error: string } {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) return { error: 'Invalid groups.' }

  const groups: MatchGroupInput[] = []
  for (const item of raw) {
    const name = typeof item?.name === 'string' ? item.name.trim() : ''
    const participantIds = Array.isArray(item?.participantIds)
      ? item.participantIds.filter((id: unknown): id is string => typeof id === 'string')
      : []
    if (!name) return { error: 'Each group needs a name.' }
    if (participantIds.length < 1) {
      return { error: "Don't save an empty group. Select at least one person." }
    }
    groups.push({ name, participantIds: [...new Set(participantIds)] })
  }
  return groups
}

async function loadMatchGroups(exchangeId: string) {
  const subgroups = await query<{ id: string; name: string }>(
    `select id, name from subgroups where group_id = $1 order by created_at asc`,
    [exchangeId],
  )
  const members = await query<{ id: string; subgroup_id: string | null }>(
    `select id, subgroup_id from participants where group_id = $1 and subgroup_id is not null`,
    [exchangeId],
  )
  const bySubgroup = new Map<string, string[]>()
  for (const member of members.rows) {
    if (!member.subgroup_id) continue
    const list = bySubgroup.get(member.subgroup_id) ?? []
    list.push(member.id)
    bySubgroup.set(member.subgroup_id, list)
  }
  return subgroups.rows.map((subgroup) => ({
    id: subgroup.id,
    name: subgroup.name,
    participantIds: bySubgroup.get(subgroup.id) ?? [],
  }))
}

async function replaceMatchGroups(
  client: pg.PoolClient,
  exchangeId: string,
  matchGroups: MatchGroupInput[],
  allowedParticipantIds: Set<string>,
) {
  for (const group of matchGroups) {
    for (const participantId of group.participantIds) {
      if (!allowedParticipantIds.has(participantId)) {
        throw Object.assign(new Error('invalid_participant'), { code: 'invalid_participant' })
      }
    }
  }

  await client.query(`update participants set subgroup_id = null where group_id = $1`, [exchangeId])
  await client.query(`delete from subgroups where group_id = $1`, [exchangeId])

  for (const group of matchGroups) {
    const inserted = await client.query<{ id: string }>(
      `insert into subgroups (group_id, name) values ($1, $2) returning id`,
      [exchangeId, group.name],
    )
    const subgroupId = inserted.rows[0]!.id
    if (group.participantIds.length) {
      await client.query(
        `update participants
         set subgroup_id = $1
         where group_id = $2 and id = any($3::uuid[])`,
        [subgroupId, exchangeId, group.participantIds],
      )
    }
  }
}

async function clearDrawAndSyncStatus(client: pg.PoolClient, exchangeId: string) {
  await client.query(`delete from assignments where group_id = $1`, [exchangeId])
  const count = await client.query<{ count: string }>(
    `select count(*)::text as count from participants where group_id = $1`,
    [exchangeId],
  )
  await client.query(`update groups set status = $1 where id = $2`, [
    statusForParticipantCount(Number(count.rows[0]?.count ?? 0)),
    exchangeId,
  ])
}

async function assertOwnedExchange(exchangeId: string, organizerId: string) {
  const result = await query<{ id: string }>(
    `select id from groups where id = $1 and organizer_id = $2`,
    [exchangeId, organizerId],
  )
  return Boolean(result.rowCount)
}

export const exchangesRouter = Router()
exchangesRouter.use(requireAuth)

exchangesRouter.get('/', async (req, res) => {
  try {
    const result = await query<{
      id: string
      name: string
      exchange_date: string | null
      minimum_budget: string | number | null
      maximum_budget: string | number | null
      status: ExchangeStatus
      participant_count: string
    }>(
      `select g.id, g.name, g.exchange_date, g.minimum_budget, g.maximum_budget, g.status,
              count(p.id)::text as participant_count
       from groups g
       left join participants p on p.group_id = g.id
       where g.organizer_id = $1
       group by g.id
       order by g.updated_at desc`,
      [req.user!.id],
    )
    return jsonOk(res, { exchanges: result.rows.map(mapSummary) })
  } catch (error) {
    console.error('[exchanges list]', error)
    return jsonError(res, 'server_error', "Couldn't load your exchanges. Please try again.", 500)
  }
})

exchangesRouter.get('/:id/assignments', async (req, res) => {
  try {
    const owned = await query<{ id: string; status: ExchangeStatus }>(
      `select id, status from groups where id = $1 and organizer_id = $2`,
      [req.params.id, req.user!.id],
    )
    const group = owned.rows[0]
    if (!group) return jsonError(res, 'not_found', 'Exchange not found.', 404)

    if (!['drawn', 'sending', 'complete'].includes(group.status)) {
      return jsonOk(res, { drawn: false, assignments: [] })
    }

    const rows = await query<{
      giver_id: string
      giver_name: string
      recipient_id: string
      recipient_name: string
    }>(
      `select a.giver_id, g.name as giver_name, a.recipient_id, r.name as recipient_name
       from assignments a
       join participants g on g.id = a.giver_id
       join participants r on r.id = a.recipient_id
       where a.group_id = $1
       order by g.created_at asc, r.created_at asc`,
      [group.id],
    )

    const byGiver = new Map<
      string,
      { giverId: string; giverName: string; recipients: string[] }
    >()
    for (const row of rows.rows) {
      const existing = byGiver.get(row.giver_id)
      if (existing) {
        existing.recipients.push(row.recipient_name)
      } else {
        byGiver.set(row.giver_id, {
          giverId: row.giver_id,
          giverName: row.giver_name,
          recipients: [row.recipient_name],
        })
      }
    }

    return jsonOk(res, {
      drawn: true,
      assignments: [...byGiver.values()],
    })
  } catch (error) {
    console.error('[exchanges assignments]', error)
    return jsonError(res, 'server_error', "Couldn't load assignments. Please try again.", 500)
  }
})

exchangesRouter.get('/:id', async (req, res) => {
  try {
    const group = await query<{
      id: string
      name: string
      exchange_date: string | null
      minimum_budget: string | number | null
      maximum_budget: string | number | null
      status: ExchangeStatus
      invite_code: string
      prevent_subgroup_matches: boolean
      allow_double_gifts: boolean
    }>(
      `select id, name, exchange_date, minimum_budget, maximum_budget, status, invite_code,
              prevent_subgroup_matches, allow_double_gifts
       from groups
       where id = $1 and organizer_id = $2`,
      [req.params.id, req.user!.id],
    )
    const row = group.rows[0]
    if (!row) return jsonError(res, 'not_found', 'Exchange not found.', 404)

    const participants = await query<{
      id: string
      name: string
      phone_number: string
      created_at: string
    }>(
      `select id, name, phone_number, created_at
       from participants
       where group_id = $1
       order by created_at asc`,
      [row.id],
    )
    const matchGroups = await loadMatchGroups(row.id)

    return jsonOk(res, {
      exchange: {
        ...mapSummary({ ...row, participant_count: participants.rowCount ?? 0 }),
        inviteCode: row.invite_code,
        participants: participants.rows.map((p) => ({
          id: p.id,
          name: p.name,
          phoneNumber: p.phone_number,
        })),
        preventWithinGroupMatches: row.prevent_subgroup_matches,
        allowDoubleGifts: row.allow_double_gifts,
        matchGroups,
      },
    })
  } catch (error) {
    console.error('[exchanges get]', error)
    return jsonError(res, 'server_error', "Couldn't load this exchange. Please try again.", 500)
  }
})

exchangesRouter.post('/', async (req, res) => {
  const client = await pool.connect()
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    if (!name) return jsonError(res, 'invalid_request', 'Enter an exchange name.')

    const exchangeDate =
      typeof req.body?.exchangeDate === 'string' && req.body.exchangeDate.trim()
        ? req.body.exchangeDate.trim()
        : null
    const minimumBudget =
      typeof req.body?.minimumBudget === 'number' ? req.body.minimumBudget : null
    const maximumBudget =
      typeof req.body?.maximumBudget === 'number' ? req.body.maximumBudget : null
    const preventWithinGroupMatches = Boolean(req.body?.preventWithinGroupMatches)
    const allowDoubleGifts = Boolean(req.body?.allowDoubleGifts)
    const participants = Array.isArray(req.body?.participants) ? req.body.participants : []
    const parsedGroups = parseMatchGroups(req.body?.matchGroups)
    if ('error' in parsedGroups) return jsonError(res, 'invalid_request', parsedGroups.error)

    const prepared: Array<{
      draftId: string | null
      name: string
      phone_number: string
      phone_normalized: string
    }> = []
    for (const raw of participants) {
      const pName = typeof raw?.name === 'string' ? raw.name.trim() : ''
      const phone = typeof raw?.phoneNumber === 'string' ? raw.phoneNumber.trim() : ''
      const draftId = typeof raw?.id === 'string' ? raw.id : null
      if (!pName || !phone) {
        return jsonError(res, 'invalid_request', 'Each participant needs a name and phone number.')
      }
      if (!toE164(phone)) {
        return jsonError(res, 'invalid_phone', `${pName} needs a valid phone number.`)
      }
      prepared.push({
        draftId,
        name: pName,
        phone_number: phone,
        phone_normalized: normalizePhone(phone),
      })
    }

    await client.query('begin')
    const groupResult = await client.query<{ id: string }>(
      `insert into groups (
         organizer_id, name, exchange_date, minimum_budget, maximum_budget, status,
         prevent_subgroup_matches, allow_double_gifts
       ) values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id`,
      [
        req.user!.id,
        name,
        exchangeDate,
        minimumBudget,
        maximumBudget,
        statusForParticipantCount(prepared.length),
        preventWithinGroupMatches,
        allowDoubleGifts,
      ],
    )
    const groupId = groupResult.rows[0]!.id
    const idMap = new Map<string, string>()

    for (const p of prepared) {
      const inserted = await client.query<{ id: string }>(
        `insert into participants (group_id, name, phone_number, phone_normalized)
         values ($1, $2, $3, $4)
         returning id`,
        [groupId, p.name, p.phone_number, p.phone_normalized],
      )
      if (p.draftId) idMap.set(p.draftId, inserted.rows[0]!.id)
    }

    const finalGroups = parsedGroups.map((group) => ({
      name: group.name,
      participantIds: group.participantIds
        .map((id) => idMap.get(id))
        .filter((id): id is string => Boolean(id)),
    }))
    for (const group of finalGroups) {
      if (!group.participantIds.length) {
        await client.query('rollback')
        return jsonError(res, 'invalid_request', "Don't save an empty group. Select at least one person.")
      }
    }

    await replaceMatchGroups(client, groupId, finalGroups, new Set(idMap.values()))
    await client.query('commit')
    return jsonOk(res, { id: groupId }, 201)
  } catch (error: unknown) {
    await client.query('rollback')
    const code = (error as { code?: string }).code
    if (code === '23505') {
      return jsonError(res, 'duplicate_phone', 'This person is already in the exchange.', 409)
    }
    console.error('[exchanges create]', error)
    return jsonError(res, 'server_error', "Couldn't create your exchange. Please try again.", 500)
  } finally {
    client.release()
  }
})

exchangesRouter.patch('/:id', async (req, res) => {
  const client = await pool.connect()
  try {
    const owned = await assertOwnedExchange(req.params.id!, req.user!.id)
    if (!owned) return jsonError(res, 'not_found', 'Exchange not found.', 404)

    const updates: string[] = []
    const params: unknown[] = []
    const push = (column: string, value: unknown) => {
      params.push(value)
      updates.push(`${column} = $${params.length}`)
    }

    if (typeof req.body?.name === 'string') {
      const name = req.body.name.trim()
      if (!name) return jsonError(res, 'invalid_request', 'Enter an exchange name.')
      push('name', name)
    }
    if ('exchangeDate' in (req.body ?? {})) {
      const exchangeDate =
        typeof req.body.exchangeDate === 'string' && req.body.exchangeDate.trim()
          ? req.body.exchangeDate.trim()
          : null
      push('exchange_date', exchangeDate)
    }
    if ('minimumBudget' in (req.body ?? {})) {
      push('minimum_budget', typeof req.body.minimumBudget === 'number' ? req.body.minimumBudget : null)
    }
    if ('maximumBudget' in (req.body ?? {})) {
      push('maximum_budget', typeof req.body.maximumBudget === 'number' ? req.body.maximumBudget : null)
    }

    let rulesChanged = false
    if (typeof req.body?.preventWithinGroupMatches === 'boolean') {
      push('prevent_subgroup_matches', req.body.preventWithinGroupMatches)
      rulesChanged = true
    }
    if (typeof req.body?.allowDoubleGifts === 'boolean') {
      push('allow_double_gifts', req.body.allowDoubleGifts)
      rulesChanged = true
    }

    if (!updates.length) return jsonError(res, 'invalid_request', 'Nothing to update.')

    await client.query('begin')
    params.push(req.params.id, req.user!.id)
    await client.query(
      `update groups set ${updates.join(', ')}
       where id = $${params.length - 1} and organizer_id = $${params.length}`,
      params,
    )
    if (rulesChanged) await clearDrawAndSyncStatus(client, req.params.id!)
    await client.query('commit')
    return jsonOk(res, { ok: true })
  } catch (error) {
    await client.query('rollback')
    console.error('[exchanges patch]', error)
    return jsonError(res, 'server_error', "Couldn't save your changes. Please try again.", 500)
  } finally {
    client.release()
  }
})

exchangesRouter.put('/:id/match-groups', async (req, res) => {
  const client = await pool.connect()
  try {
    const owned = await assertOwnedExchange(req.params.id!, req.user!.id)
    if (!owned) return jsonError(res, 'not_found', 'Exchange not found.', 404)

    const parsedGroups = parseMatchGroups(req.body?.matchGroups)
    if ('error' in parsedGroups) return jsonError(res, 'invalid_request', parsedGroups.error)

    const participants = await query<{ id: string }>(
      `select id from participants where group_id = $1`,
      [req.params.id],
    )
    const allowed = new Set(participants.rows.map((p) => p.id))

    await client.query('begin')
    await replaceMatchGroups(client, req.params.id!, parsedGroups, allowed)
    await clearDrawAndSyncStatus(client, req.params.id!)
    await client.query('commit')
    return jsonOk(res, { ok: true, matchGroups: await loadMatchGroups(req.params.id!) })
  } catch (error: unknown) {
    await client.query('rollback')
    if ((error as { code?: string }).code === 'invalid_participant') {
      return jsonError(res, 'invalid_request', 'A group references an unknown participant.')
    }
    console.error('[exchanges match-groups]', error)
    return jsonError(res, 'server_error', "Couldn't save groups. Please try again.", 500)
  } finally {
    client.release()
  }
})

exchangesRouter.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      `delete from groups
       where id = $1 and organizer_id = $2 and status in ('draft', 'ready_to_draw')
       returning id`,
      [req.params.id, req.user!.id],
    )
    if (!result.rowCount) {
      return jsonError(
        res,
        'cannot_delete',
        'Exchanges that have already been drawn cannot be deleted.',
        409,
      )
    }
    return jsonOk(res, { ok: true })
  } catch (error) {
    console.error('[exchanges delete]', error)
    return jsonError(res, 'server_error', "Couldn't delete this exchange. Please try again.", 500)
  }
})

exchangesRouter.post('/:id/participants', async (req, res) => {
  try {
    if (!(await assertOwnedExchange(req.params.id!, req.user!.id))) {
      return jsonError(res, 'not_found', 'Exchange not found.', 404)
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const phone = typeof req.body?.phoneNumber === 'string' ? req.body.phoneNumber.trim() : ''
    if (!name || !phone) {
      return jsonError(res, 'invalid_request', 'Each participant needs a name and phone number.')
    }
    if (!toE164(phone)) {
      return jsonError(res, 'invalid_phone', `${name} needs a valid phone number.`)
    }

    await query(
      `insert into participants (group_id, name, phone_number, phone_normalized)
       values ($1, $2, $3, $4)`,
      [req.params.id, name, phone, normalizePhone(phone)],
    )
    await syncAfterParticipantChange(req.params.id!)
    return jsonOk(res, { ok: true }, 201)
  } catch (error: unknown) {
    if ((error as { code?: string }).code === '23505') {
      return jsonError(res, 'duplicate_phone', 'This person is already in the exchange.', 409)
    }
    console.error('[exchanges add participant]', error)
    return jsonError(res, 'server_error', "Couldn't add this participant. Please try again.", 500)
  }
})

exchangesRouter.patch('/:id/participants/:participantId', async (req, res) => {
  try {
    if (!(await assertOwnedExchange(req.params.id!, req.user!.id))) {
      return jsonError(res, 'not_found', 'Exchange not found.', 404)
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const phone = typeof req.body?.phoneNumber === 'string' ? req.body.phoneNumber.trim() : ''
    if (!name || !phone) {
      return jsonError(res, 'invalid_request', 'Each participant needs a name and phone number.')
    }
    if (!toE164(phone)) {
      return jsonError(res, 'invalid_phone', `${name} needs a valid phone number.`)
    }

    const result = await query(
      `update participants
       set name = $1, phone_number = $2, phone_normalized = $3
       where id = $4 and group_id = $5
       returning id`,
      [name, phone, normalizePhone(phone), req.params.participantId, req.params.id],
    )
    if (!result.rowCount) return jsonError(res, 'not_found', 'Participant not found.', 404)
    await syncAfterParticipantChange(req.params.id!)
    return jsonOk(res, { ok: true })
  } catch (error: unknown) {
    if ((error as { code?: string }).code === '23505') {
      return jsonError(res, 'duplicate_phone', 'This person is already in the exchange.', 409)
    }
    console.error('[exchanges update participant]', error)
    return jsonError(res, 'server_error', "Couldn't update this participant. Please try again.", 500)
  }
})

exchangesRouter.delete('/:id/participants/:participantId', async (req, res) => {
  try {
    if (!(await assertOwnedExchange(req.params.id!, req.user!.id))) {
      return jsonError(res, 'not_found', 'Exchange not found.', 404)
    }

    const result = await query(
      'delete from participants where id = $1 and group_id = $2 returning id',
      [req.params.participantId, req.params.id],
    )
    if (!result.rowCount) return jsonError(res, 'not_found', 'Participant not found.', 404)

    // Drop empty match groups left behind after removing a participant.
    await query(
      `delete from subgroups sg
       where sg.group_id = $1
         and not exists (
           select 1 from participants p where p.subgroup_id = sg.id
         )`,
      [req.params.id],
    )
    await syncAfterParticipantChange(req.params.id!)
    return jsonOk(res, { ok: true })
  } catch (error) {
    console.error('[exchanges remove participant]', error)
    return jsonError(res, 'server_error', "Couldn't remove this participant. Please try again.", 500)
  }
})

exchangesRouter.post('/:id/draw', async (req, res) => {
  const client = await pool.connect()
  try {
    const groupResult = await client.query<{
      id: string
      organizer_participates: boolean
      prevent_subgroup_matches: boolean
      allow_double_gifts: boolean
    }>(
      `select id, organizer_participates, prevent_subgroup_matches, allow_double_gifts
       from groups
       where id = $1 and organizer_id = $2`,
      [req.params.id, req.user!.id],
    )
    const group = groupResult.rows[0]
    if (!group) return jsonError(res, 'not_found', 'Exchange not found.', 404)

    const participants = await client.query<{
      id: string
      name: string
      phone_number: string
      subgroup_id: string | null
      is_organizer: boolean
    }>(
      `select id, name, phone_number, subgroup_id, is_organizer
       from participants where group_id = $1`,
      [group.id],
    )

    const poolRows = participants.rows.filter(
      (p) => group.organizer_participates || !p.is_organizer,
    )
    if (poolRows.length < 2) {
      return jsonError(res, 'too_few', 'You need at least 2 participants in the exchange.', 422)
    }

    const missingPhone = poolRows.find((p) => !toE164(p.phone_number ?? ''))
    if (missingPhone) {
      return jsonError(
        res,
        'invalid_phone',
        `${missingPhone.name} needs a valid phone number before you can draw names.`,
        422,
      )
    }

    const subgroupMembers = new Map<string, string[]>()
    for (const p of poolRows) {
      if (!p.subgroup_id) continue
      const members = subgroupMembers.get(p.subgroup_id) ?? []
      members.push(p.id)
      subgroupMembers.set(p.subgroup_id, members)
    }
    const subgroups: Subgroup[] = [...subgroupMembers].map(([id, participantIds]) => ({
      id,
      participantIds,
    }))

    const result = generateAssignments(
      poolRows.map((p) => p.id),
      subgroups,
      group.prevent_subgroup_matches,
      group.allow_double_gifts,
    )
    if (!result.ok) return jsonError(res, result.code, result.error, 422)

    await client.query('begin')
    await client.query('delete from assignments where group_id = $1', [group.id])
    for (const a of result.assignments) {
      await client.query(
        `insert into assignments (group_id, giver_id, recipient_id)
         values ($1, $2, $3)`,
        [group.id, a.giverId, a.recipientId],
      )
    }
    await client.query(`update groups set status = 'drawn' where id = $1`, [group.id])
    await client.query('commit')

    return jsonOk(res, {
      ok: true,
      participantCount: poolRows.length,
      usedDoubleGifts: result.usedDoubleGifts,
      doubleRecipientCount: result.doubleRecipientCount,
    })
  } catch (error) {
    await client.query('rollback')
    console.error('[exchanges draw]', error)
    return jsonError(res, 'server_error', "Couldn't draw names. Please try again.", 500)
  } finally {
    client.release()
  }
})

async function syncAfterParticipantChange(groupId: string) {
  const count = await query<{ count: string }>(
    'select count(*)::text as count from participants where group_id = $1',
    [groupId],
  )
  await query('delete from assignments where group_id = $1', [groupId])
  await query('update groups set status = $1 where id = $2', [
    statusForParticipantCount(Number(count.rows[0]?.count ?? 0)),
    groupId,
  ])
}
