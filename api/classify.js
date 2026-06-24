import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { title, description } = req.body
  if (!title || !description) {
    return res.status(400).json({ error: 'title and description are required' })
  }

  const prompt = `너는 대학교 학생 컴플레인을 분류하는 도우미야.
아래 컴플레인을 읽고 다음 필드를 가진 JSON 객체만 반환해. 다른 텍스트는 절대 포함하지 마.

{
  "category": "시설" | "학사" | "행정" | "기타",
  "sentiment": "긍정" | "중립" | "부정",
  "type": "요청형" | "단순불만" | "문의" | "칭찬",
  "priority": "low" | "medium" | "high",
  "summary": "핵심 이슈를 한 문장(최대 120자)으로 중립적으로 요약",
  "tags": ["짧은소문자키워드", "2~4개"]
}

category 기준: "시설"(건물/설비/엘리베이터 등), "학사"(수업/성적/교수 등), "행정"(행정 처리/민원 응대 등), "기타"
type 기준: 구체적 조치 요구→"요청형", 단순 불만→"단순불만", 질문/정보 요청→"문의", 긍정 피드백→"칭찬"
priority 기준: 긴급도와 캠퍼스 전체 영향도 고려

컴플레인 제목: ${title}
컴플레인 내용: ${description}`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })
    const parsed = JSON.parse(completion.choices[0].message.content)
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('classify error:', err)
    return res.status(500).json({ error: err?.message ?? 'AI classification failed' })
  }
}
