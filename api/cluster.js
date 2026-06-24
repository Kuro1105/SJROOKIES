import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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

For each cluster return:
- theme: short descriptive label (e.g. "Poor Wi-Fi in Academic Buildings")
- count: how many complaints belong to this cluster
- indices: array of complaint numbers belonging to this cluster (1-based)
- insight: one actionable sentence describing what the campus can improve
- severity: "low" | "medium" | "high"

Complaints:
${formatted}

Respond ONLY with valid JSON in this exact shape (no markdown fences, no explanation):
{ "clusters": [ { "theme": "...", "count": 0, "indices": [], "insight": "...", "severity": "..." } ] }`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('cluster error:', err)
    return res.status(500).json({ error: 'AI clustering failed' })
  }
}
