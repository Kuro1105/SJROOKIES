import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

const CATEGORIES = [
  'Facilities & Infrastructure',
  'Academic & Teaching',
  'Safety & Security',
  'IT & Technology',
  'Food & Cafeteria',
  'Transportation',
  'Administration & Bureaucracy',
  'Student Services',
  'Health & Wellness',
  'Other',
]

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { title, description } = req.body
  if (!title || !description) {
    return res.status(400).json({ error: 'title and description are required' })
  }

  const prompt = `You are an AI classifier for a campus complaint system.

Analyze the following complaint and return a JSON object with these fields:
- category: one of ${JSON.stringify(CATEGORIES)}
- priority: "low" | "medium" | "high" (based on urgency and impact)
- sentiment: "negative" | "neutral" | "very_negative"
- summary: a 1-sentence neutral summary of the core issue (max 120 chars)
- tags: array of 2-4 short keyword tags (e.g. ["wifi", "library", "slow"])

Complaint title: ${title}
Complaint description: ${description}

Respond ONLY with valid JSON. No explanation, no markdown fences.`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('classify error:', err)
    return res.status(500).json({ error: 'AI classification failed' })
  }
}
