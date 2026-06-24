import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function ClusterCard({ cluster }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{cluster.label}</h3>
        <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full text-white bg-brand-600">
          {cluster.complaintCount} reports
        </span>
      </div>
      {cluster.suggestedSolution ? (
        <p className="text-gray-600 text-xs leading-relaxed">{cluster.suggestedSolution}</p>
      ) : (
        <p className="text-gray-400 text-xs leading-relaxed">
          아직 충분히 반복되지 않아 해결방안이 생성되지 않았습니다.
        </p>
      )}
    </div>
  )
}

export default function Insights() {
  const [clusters, setClusters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'clusters'), orderBy('complaintCount', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setClusters(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const chartData = clusters.map((c) => ({
    name: c.label.length > 30 ? `${c.label.slice(0, 30)}…` : c.label,
    count: c.complaintCount,
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
        <p className="text-gray-500 text-sm">요청형 컴플레인이 누적되어 자동으로 묶인 클러스터</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : clusters.length === 0 ? (
        <div className="text-center py-20 text-gray-400">아직 클러스터가 없습니다.</div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Cluster Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ left: -10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {clusters.map((c) => (
              <ClusterCard key={c.id} cluster={c} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
