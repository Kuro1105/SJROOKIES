import { InferenceClient } from '@huggingface/inference'

const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2'

export default async function handler(req, res) {
  const hf = new InferenceClient(process.env.HF_API_KEY)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body
  if (!text) {
    return res.status(400).json({ error: 'text is required' })
  }

  try {
    const result = await hf.featureExtraction({
      model: HF_MODEL,
      inputs: text,
    })
    // featureExtraction returns number[][] for a single string — take the first row
    const embedding = Array.isArray(result[0]) ? result[0] : result
    return res.status(200).json({ embedding })
  } catch (err) {
    console.error('embed error:', err)
    return res.status(500).json({ error: err?.message ?? 'AI embedding failed' })
  }
}
