import type { Response } from 'express'

export function jsonOk(res: Response, body: Record<string, unknown>, status = 200) {
  return res.status(status).json(body)
}

export function jsonError(
  res: Response,
  code: string,
  message: string,
  status = 400,
  extra: Record<string, unknown> = {},
) {
  return res.status(status).json({ error: code, message, ...extra })
}
