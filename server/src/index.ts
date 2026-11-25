import cors from 'cors'
import express from 'express'
import { env } from './env.js'
import { authRouter } from './routes/auth.js'
import { exchangesRouter } from './routes/exchanges.js'
import { joinRouter } from './routes/join.js'

const app = express()

app.use(
  cors({
    origin: env.corsOrigin.split(',').map((value) => value.trim()),
    credentials: true,
  }),
)
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api/exchanges', exchangesRouter)
app.use('/api/join', joinRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'not_found', message: 'Not found.' })
})

app.listen(env.port, () => {
  console.log(`SantaSwap API listening on http://localhost:${env.port}`)
})
