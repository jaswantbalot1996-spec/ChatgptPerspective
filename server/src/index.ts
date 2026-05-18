import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import generateRouter from './routes/generate.js'

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  methods: ['GET', 'POST'],
}))
app.use(express.json())

// ─── Routes ──────────────────────────────────────────────────
app.use('/api', generateRouter)

// ─── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', model: process.env.LLM_MODEL ?? 'gemini-2.5-flash-lite' })
})

// ─── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`)
  console.log(`[Server] Model: ${process.env.LLM_MODEL ?? 'gemini-2.5-flash-lite'}`)
})
