import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body
  if (!text) {
    return res.status(400).json({ error: 'text is required' })
  }

  try {
    const result = await model.embedContent(text)
    return res.status(200).json({ embedding: result.embedding.values })
  } catch (err) {
    console.error('embed error:', err)
    return res.status(500).json({ error: 'AI embedding failed' })
  }
}
