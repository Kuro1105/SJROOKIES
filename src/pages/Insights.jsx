import { useEffect, useState } from 'react'
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const SEVERITY_COLOR = {
  high:   '#8B1A2E',
  medium: '#d97706',
  low:    '#16a34a',
}

const SEVERITY_BADGE = {
  high:   'bg-brand-100 text-brand-800 border-brand-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low:    'bg-green-100 text-green-700 border-green-200',
}

const CLUSTER_ICONS = [
  <path key="wifi" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />,
  <path key="therm" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19V6.75A2.25 2.25 0 0111.25 4.5h1.5A2.25 2.25 0 0115 6.75V19m-6 0a3 3 0 106 0m-6 0H6m9 0h3" />,
  <path key="build" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  <path key="food" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  <path key="shield" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  <path key="bus" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 17h8M8 17a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4zm-9.5-5h11M6 12V7a4 4 0 014-4h4a4 4 0 014 4v5M4 12h16" />,
]

function ClusterCard({ cluster, index }) {
  const color = SEVERITY_COLOR[cluster.severity] ?? '#6366f1'
  const badge = SEVERITY_BADGE[cluster.severity] ?? 'bg-violet-100 text-violet-700 border-violet-200'
  const icon  = CLUSTER_ICONS[index % CLUSTER_ICONS.length]
  const pct   = Math.min(100, (cluster.count / 30) * 100)

  return (
    <div className="bg-white border border-sand-300 rounded-2xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4 mb-3">
        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 text-sm leading-snug">{cluster.theme}</h3>
            <span className="text-sm font-bold text-gray-900 shrink-0">{cluster.count} reports</span>
          </div>
          <span className={`inline-block mt-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border capitalize ${badge}`}>
            {cluster.severity} severity
          </span>
        </div>
      </div>
      <p className="text-gray-500 text-xs leading-relaxed mb-4">{cluster.insight}</p>
      <div className="h-1.5 bg-sand-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function RecommendationCard({ rec, index }) {
  const badge = SEVERITY_BADGE[rec.priority] ?? 'bg-violet-100 text-violet-700 border-violet-200'
  return (
    <div className="bg-white border border-sand-300 rounded-2xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-sand-100 flex items-center justify-center shrink-0 text-base font-extrabold text-brand-800">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-gray-900 text-sm leading-snug">{rec.title}</h3>
            <span className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full border capitalize ${badge}`}>
              {rec.priority}
            </span>
          </div>
          <p className="text-gray-500 text-xs leading-relaxed">{rec.description}</p>
        </div>
      </div>
    </div>
  )
}

export default function Insights() {
  const [clusters, setClusters]           = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [chartData, setChartData]         = useState([])
  const [status, setStatus]               = useState('idle')
  const [lastRun, setLastRun]             = useState(null)

  async function runAnalysis() {
    setStatus('loading')
    setClusters([])
    setRecommendations([])

    try {
      const snap = await getDocs(
        query(collection(db, 'complaints'), orderBy('createdAt', 'desc'), limit(100))
      )
      const complaints = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      if (complaints.length === 0) { setStatus('idle'); return }

      const res = await fetch('/api/cluster', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ complaints }),
      })
      if (!res.ok) throw new Error('Cluster API failed')

      const { clusters: raw, recommendations: recs } = await res.json()
      setClusters(raw ?? [])
      setRecommendations(recs ?? [])
      setChartData(
        (raw ?? [])
          .sort((a, b) => b.count - a.count)
          .map(c => ({ name: c.theme.length > 28 ? c.theme.slice(0, 28) + '…' : c.theme, count: c.count, severity: c.severity }))
      )
      setLastRun(new Date())
      setStatus('done')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  useEffect(() => { runAnalysis() }, [])

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-bold text-brand-800 uppercase tracking-widest mb-1.5">AI-Powered Analysis</p>
          <h1 className="text-3xl font-extrabold text-gray-900">Insights</h1>
          <p className="text-gray-400 text-sm mt-1">
            {lastRun
              ? `Recurring themes across all campus reports · ${lastRun.toLocaleTimeString()}`
              : 'Recurring themes across all campus reports, clustered automatically.'}
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={status === 'loading'}
          className="shrink-0 flex items-center gap-2 bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors mt-1"
        >
          <svg className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {status === 'loading' ? 'Analyzing…' : 'Re-analyze'}
        </button>
      </div>

      {status === 'loading' && (
        <div className="text-center py-20">
          <svg className="w-8 h-8 animate-spin text-brand-800 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-gray-400 text-sm">AI is analyzing all reports…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm text-center mb-6">
          Analysis failed. Please try again.
        </div>
      )}

      {status === 'done' && (
        <>
          {/* Bar chart */}
          {chartData.length > 0 && (
            <div className="bg-white border border-sand-300 rounded-2xl p-5 mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Theme Distribution</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ left: -10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e0ddd4', fontSize: '12px', backgroundColor: 'white' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={SEVERITY_COLOR[entry.severity] ?? '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Clusters */}
          {clusters.length > 0 && (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Common Issues</p>
              <div className="space-y-3 mb-8">
                {clusters.map((cluster, i) => (
                  <ClusterCard key={i} cluster={cluster} index={i} />
                ))}
              </div>
            </>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Campus Improvement Recommendations</p>
                <div className="flex-1 h-px bg-sand-200" />
              </div>
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <RecommendationCard key={i} rec={rec} index={i} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
