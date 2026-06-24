import express from 'express'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

import classifyHandler from './api/classify.js'
import embedHandler from './api/embed.js'
import solutionHandler from './api/solution.js'

const app = express()
app.use(express.json())

app.post('/api/classify', classifyHandler)
app.post('/api/embed', embedHandler)
app.post('/api/solution', solutionHandler)

if (process.env.NODE_ENV === 'production') {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  app.use(express.static(join(__dirname, 'dist')))
  app.get('*', (_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')))
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`))
