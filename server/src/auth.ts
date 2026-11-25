import type { NextFunction, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from './env.js'
import { jsonError } from './http.js'

export type AuthUser = {
  id: string
  email: string
  name: string | null
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

type TokenPayload = {
  sub: string
  email: string
  name: string | null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { email: user.email, name: user.name } satisfies Omit<TokenPayload, 'sub'>,
    env.jwtSecret,
    { subject: user.id, expiresIn: '30d' },
  )
}

export function readToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload & TokenPayload
    if (!payload.sub || !payload.email) return null
    return { id: payload.sub, email: payload.email, name: payload.name ?? null }
  } catch {
    return null
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    jsonError(res, 'unauthorized', 'Please sign in again.', 401)
    return
  }
  const user = readToken(token)
  if (!user) {
    jsonError(res, 'unauthorized', 'Please sign in again.', 401)
    return
  }
  req.user = user
  next()
}
