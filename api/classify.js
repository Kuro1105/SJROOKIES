import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        category: {
          type: SchemaType.STRING,
          enum: ['시설', '학사', '행정', '기타'],
        },
        sentiment: {
          type: SchemaType.STRING,
          enum: ['긍정', '중립', '부정'],
        },
        type: {
          type: SchemaType.STRING,
          enum: ['요청형', '단순불만', '문의', '칭찬'],
        },
        priority: {
          type: SchemaType.STRING,
          enum: ['low', 'medium', 'high'],
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
      required: ['category', 'sentiment', 'type', 'priority', 'summary', 'tags'],
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

  const prompt = `너는 대학교 학생 컴플레인을 분류하는 도우미야.
아래 컴플레인을 읽고 다음 기준으로 분류해줘.

- category: 컴플레인의 주제. "시설"(건물/설비/엘리베이터 등), "학사"(수업/성적/교수 등), \
"행정"(행정 처리/민원 응대 등), "기타" 중 하나.
- sentiment: 컴플레인의 감정. "긍정", "중립", "부정" 중 하나.
- type: 컴플레인의 성격. 구체적인 조치를 요구하는 경우 "요청형", \
단순히 불만을 토로하는 경우 "단순불만", 질문/정보 요청인 경우 "문의", \
긍정적 피드백인 경우 "칭찬" 중 하나.
- priority: 긴급도와 캠퍼스 전체 영향도를 고려해 "low" | "medium" | "high" 중 하나.
- summary: 핵심 이슈를 한 문장(최대 120자)으로 중립적으로 요약.
- tags: 짧은 소문자 키워드 2~4개.

컴플레인 제목: ${title}
컴플레인 내용: ${description}`

  try {
    const result = await model.generateContent(prompt)
    const parsed = JSON.parse(result.response.text())
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('classify error:', err)
    return res.status(500).json({ error: 'AI classification failed' })
  }
}
