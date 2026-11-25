import { Router } from 'express'
import { hashPassword, requireAuth, signToken, verifyPassword } from '../auth.js'
import { query } from '../db.js'
import { jsonError, jsonOk } from '../http.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const authRouter = Router()

authRouter.post('/signup', async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''

    if (!name) return jsonError(res, 'invalid_request', 'Enter your name.')
    if (!EMAIL_PATTERN.test(email)) return jsonError(res, 'invalid_request', 'Enter a valid email address.')
    if (password.length < 8) {
      return jsonError(res, 'invalid_request', 'Password must be at least 8 characters.')
    }

    const existing = await query<{ id: string }>(
      'select id from users where email = $1',
      [email],
    )
    if (existing.rowCount) {
      return jsonError(
        res,
        'email_taken',
        'An account with this email already exists. Try logging in instead.',
        409,
      )
    }

    const passwordHash = await hashPassword(password)
    const inserted = await query<{ id: string; email: string; name: string | null }>(
      `insert into users (email, password_hash, name)
       values ($1, $2, $3)
       returning id, email, name`,
      [email, passwordHash, name],
    )
    const user = inserted.rows[0]!
    const token = signToken(user)
    return jsonOk(res, { token, user }, 201)
  } catch (error) {
    console.error('[auth/signup]', error)
    return jsonError(res, 'server_error', 'Something went wrong. Please try again.', 500)
  }
})

authRouter.post('/login', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''

    const result = await query<{ id: string; email: string; name: string | null; password_hash: string }>(
      'select id, email, name, password_hash from users where email = $1',
      [email],
    )
    const row = result.rows[0]
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      return jsonError(res, 'invalid_credentials', 'Email or password is incorrect.', 401)
    }

    const user = { id: row.id, email: row.email, name: row.name }
    return jsonOk(res, { token: signToken(user), user })
  } catch (error) {
    console.error('[auth/login]', error)
    return jsonError(res, 'server_error', 'Something went wrong. Please try again.', 500)
  }
})

authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await query<{ id: string; email: string; name: string | null }>(
      'select id, email, name from users where id = $1',
      [req.user!.id],
    )
    const user = result.rows[0]
    if (!user) return jsonError(res, 'unauthorized', 'Please sign in again.', 401)
    return jsonOk(res, { user })
  } catch (error) {
    console.error('[auth/me]', error)
    return jsonError(res, 'server_error', 'Something went wrong. Please try again.', 500)
  }
})

authRouter.patch('/me', requireAuth, async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    if (!name) return jsonError(res, 'invalid_request', 'Enter your name.')

    const result = await query<{ id: string; email: string; name: string | null }>(
      `update users set name = $1 where id = $2
       returning id, email, name`,
      [name, req.user!.id],
    )
    const user = result.rows[0]
    if (!user) return jsonError(res, 'unauthorized', 'Please sign in again.', 401)
    return jsonOk(res, { token: signToken(user), user })
  } catch (error) {
    console.error('[auth/me patch]', error)
    return jsonError(res, 'server_error', "Couldn't update your name. Please try again.", 500)
  }
})
