import { Router } from 'express'
import type { Request, Response } from 'express'
import { explore, expand } from '../services/llmService.js'
import type { ExploreRequest, ExpandRequest } from '../types/index.js'

const router = Router()

// POST /api/explore
// Body: { userPrompt: string, history: Array<{question, answer}> }
router.post('/explore', async (req: Request, res: Response) => {
  const { userPrompt, history = [] } = req.body as ExploreRequest

  if (!userPrompt || typeof userPrompt !== 'string') {
    res.status(400).json({ error: 'userPrompt is required and must be a string' })
    return
  }

  const result = await explore(userPrompt, history)
  res.json(result)
})

// POST /api/expand
// Body: { ctx: LLMContext }
router.post('/expand', async (req: Request, res: Response) => {
  const { ctx } = req.body as ExpandRequest

  if (!ctx || !ctx.currentQuestion) {
    res.status(400).json({ error: 'ctx with currentQuestion is required' })
    return
  }

  const result = await expand(ctx)
  res.json(result)
})

export default router
