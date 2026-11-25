import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sql = readFileSync(resolve(root, 'sql/schema.sql'), 'utf8')

async function main() {
  console.log('Applying schema to DATABASE_URL…')
  await pool.query(sql)
  console.log('Schema applied.')
  await pool.end()
}

main().catch(async (error) => {
  console.error(error)
  await pool.end()
  process.exit(1)
})
