import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        clusters: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              theme:   { type: SchemaType.STRING },
              count:   { type: SchemaType.INTEGER },
              indices: { type: SchemaType.ARRAY, items: { type: SchemaType.INTEGER } },
              insight: { type: SchemaType.STRING },
              severity: {
                type: SchemaType.STRING,
                enum: ['low', 'medium', 'high'],
              },
            },
            required: ['theme', 'count', 'indices', 'insight', 'severity'],
          },
        },
      },
      required: ['clusters'],
    },
  },
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { complaints } = req.body
  if (!Array.isArray(complaints) || complaints.length === 0) {
    return res.status(400).json({ error: 'complaints array is required' })
  }

  const formatted = complaints
    .slice(0, 100)
    .map((c, i) => `[${i + 1}] ${c.title}: ${c.description}`)
    .join('\n')

  const prompt = `You are an AI analyst for a campus improvement platform.

Below are recent student complaints (numbered). Group them into 4-8 meaningful thematic clusters that reveal the most impactful campus issues.

For each cluster:
- theme: a short descriptive label for the recurring issue
- count: how many complaints belong to this cluster
- indices: 1-based complaint numbers in this cluster
- insight: one actionable sentence describing what the campus can improve
- severity: how urgently this needs addressing

Complaints:
${formatted}`

  try {
    const result = await model.generateContent(prompt)
    const parsed = JSON.parse(result.response.text())
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('cluster error:', err)
    return res.status(500).json({ error: 'AI clustering failed' })
  }
}
