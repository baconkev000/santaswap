import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sqlDir = resolve(root, 'sql')

async function main() {
  const files = readdirSync(sqlDir)
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => {
      // Keep schema.sql first, then chronological migration filenames.
      if (a === 'schema.sql') return -1
      if (b === 'schema.sql') return 1
      return a.localeCompare(b)
    })

  console.log('Applying SQL from', sqlDir)
  for (const file of files) {
    const sql = readFileSync(resolve(sqlDir, file), 'utf8')
    console.log(`→ ${file}`)
    await pool.query(sql)
  }
  console.log('Schema applied.')
  await pool.end()
}

main().catch(async (error) => {
  console.error(error)
  await pool.end()
  process.exit(1)
})
