import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { texts, count } = req.body
  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: 'texts array is required' })
  }

  const bulletList = texts.map((t) => `- ${t}`).join('\n')
  const prompt = `너는 대학교 행정 담당자를 돕는 도우미야.
아래는 같은 문제로 묶인 학생 요구사항/컴플레인 ${count}건이야.
이건 한 명의 일회성 불만이 아니라 서로 다른 제출에서 ${count}번 반복 확인된 \
공통 요구사항이니, 우선적으로 조치가 필요한 문제로 판단하고 제안해줘.
관리자가 바로 실행할 수 있는 구체적인 해결방안을 2~3문장으로 제안해줘. \
불필요한 서론 없이 해결방안만 말해줘.

요구사항/컴플레인 목록 (${count}건):
${bulletList}`

  try {
    const result = await model.generateContent(prompt)
    return res.status(200).json({ solution: result.response.text().trim() })
  } catch (err) {
    console.error('solution error:', err)
    return res.status(500).json({ error: 'AI solution suggestion failed' })
  }
}
