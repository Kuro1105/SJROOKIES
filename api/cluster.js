import Groq from 'groq-sdk'

export default async function handler(req, res) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { complaints } = req.body
  if (!Array.isArray(complaints) || complaints.length === 0) {
    return res.status(400).json({ error: 'complaints array is required' })
  }

  const summaries = complaints
    .map((c, i) => `${i + 1}. [${c.category ?? '기타'}] ${c.title}: ${c.description ?? ''}`)
    .join('\n')

  const prompt = `너는 대학교 캠퍼스 관리 분석 전문가야.
아래는 학생들이 제출한 ${complaints.length}건의 캠퍼스 컴플레인이야.

반드시 아래 JSON 형식으로만 응답해:
{
  "clusters": [
    {
      "theme": "short English theme name",
      "count": number_of_matching_complaints,
      "severity": "high" | "medium" | "low",
      "insight": "1-2문장으로 이 문제를 설명 (한국어)"
    }
  ],
  "recommendations": [
    {
      "title": "개선 제안 제목 (한국어, 짧게)",
      "description": "관리자가 바로 실행할 수 있는 구체적인 방안 2-3문장 (한국어)",
      "priority": "high" | "medium" | "low"
    }
  ]
}

규칙:
- clusters: 유사한 컴플레인을 3~6개 주제로 묶어. count는 실제 해당 컴플레인 수의 합.
- severity: 캠퍼스 전체 영향도와 반복 빈도 기준
- recommendations: 가장 자주 반복된 문제 기반으로 3~5개 실행 가능한 캠퍼스 개선 제안

컴플레인 목록:
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
