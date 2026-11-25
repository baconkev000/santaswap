import { config } from 'dotenv'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
config({ path: resolve(root, '.env') })
config({ path: resolve(root, '.env.local'), override: true })

function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

export const env = {
  port: Number(process.env.PORT || 3001),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  corsOrigin: process.env.CORS_ORIGIN?.trim() || 'http://localhost:5173',
  lookupSecret:
    process.env.PARTICIPANT_LOOKUP_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    'dev-lookup-secret',
}
