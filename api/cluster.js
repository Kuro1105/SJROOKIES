import Groq from 'groq-sdk'

export default async function handler(req, res) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, fetch })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { complaints } = req.body
  if (!Array.isArray(complaints) || complaints.length === 0) {
    return res.status(400).json({ error: 'complaints array is required' })
  }

  const summaries = complaints
    .map((c, i) => `${i + 1}. [${c.category ?? '기타'}] ${c.title}: ${c.description ?? ''}`)
    .join('\n')

  const prompt = `You are an expert campus management analyst.
Below are ${complaints.length} student complaints submitted to the university.

Respond ONLY with valid JSON in exactly this format — no extra text:
{
  "clusters": [
    {
      "theme": "Short theme name (3-5 words)",
      "count": number_of_matching_complaints,
      "severity": "high" | "medium" | "low",
      "insight": "1-2 sentences describing the core problem and why it matters to students."
    }
  ],
  "recommendations": [
    {
      "title": "Short actionable title",
      "description": "2-3 sentences of concrete steps the university administration should take immediately to address this issue and improve campus life.",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Rules:
- clusters: group similar complaints into 3-6 themes. count = total complaints in that group.
- severity: based on how broadly it affects campus life and how frequently it repeats.
- recommendations: 3-5 specific, actionable improvements the university must make, ordered by priority. Focus on the most common and most impactful issues.

Complaint list:
${summaries}`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })
    const parsed = JSON.parse(completion.choices[0].message.content)
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('cluster error:', err)
    return res.status(500).json({ error: err?.message ?? 'Analysis failed' })
  }
}
