// 기존 클러스터와의 유사도 비교 및 병합/생성 로직.

export const SIMILARITY_THRESHOLD = 0.85

export function cosineSimilarity(a, b) {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function findMatchingCluster(embedding, clusters) {
  let bestMatch = null
  let bestScore = SIMILARITY_THRESHOLD
  for (const cluster of clusters) {
    const score = cosineSimilarity(embedding, cluster.centroidEmbedding)
    if (score >= bestScore) {
      bestScore = score
      bestMatch = cluster
    }
  }
  return bestMatch
}

// 클러스터에 컴플레인이 추가될 때 중심값을 누적 평균으로 갱신.
export function updateCentroid(centroid, newVector, count) {
  return centroid.map((c, i) => (c * count + newVector[i]) / (count + 1))
}
