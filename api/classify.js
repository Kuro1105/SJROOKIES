import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        category: {
          type: SchemaType.STRING,
          description: 'A concise 2-5 word label describing the type of complaint (e.g. "Library Wi-Fi Issues", "Broken Classroom AC")',
        },
        priority: {
          type: SchemaType.STRING,
          enum: ['low', 'medium', 'high'],
        },
        sentiment: {
          type: SchemaType.STRING,
          enum: ['negative', 'neutral', 'very_negative'],
        },
        summary: {
          type: SchemaType.STRING,
          description: 'A 1-sentence neutral summary of the core issue (max 120 chars)',
        },
        tags: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: '2-4 short keyword tags (e.g. ["wifi", "library", "slow"])',
        },
      },
      required: ['category', 'priority', 'sentiment', 'summary', 'tags'],
    },
  },
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { title, description } = req.body
  if (!title || !description) {
    return res.status(400).json({ error: 'title and description are required' })
  }

  const prompt = `You are an AI classifier for a campus complaint system.

Analyze the following complaint:
- category: invent a concise 2-5 word label that precisely describes this specific issue (be specific, not generic — e.g. "Library Wi-Fi Outages" not "IT Issues")
- priority: assess urgency and campus-wide impact
- sentiment: assess the emotional tone of the complaint
- summary: a neutral 1-sentence summary of the core issue (max 120 chars)
- tags: 2-4 short lowercase keyword tags

Complaint title: ${title}
Complaint description: ${description}`

  try {
    const result = await model.generateContent(prompt)
    const parsed = JSON.parse(result.response.text())
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('classify error:', err)
    return res.status(500).json({ error: 'AI classification failed' })
  }
}
