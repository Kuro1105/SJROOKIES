import { useEffect, useState } from 'react'
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const SEVERITY_COLOR = {
  high:   '#ef4444',
  medium: '#f59e0b',
  low:    '#22c55e',
}

function ClusterCard({ cluster, index }) {
  const color = SEVERITY_COLOR[cluster.severity] ?? '#6366f1'
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{cluster.theme}</h3>
        <span
          className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          {cluster.severity}
        </span>
      </div>
      <p className="text-gray-500 text-xs mb-3 leading-relaxed">{cluster.insight}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full"
            style={{ width: `${Math.min(100, (cluster.count / 10) * 100)}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-xs text-gray-500 shrink-0">{cluster.count} report{cluster.count !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

export default function Insights() {
  const [clusters, setClusters]   = useState([])
  const [chartData, setChartData] = useState([])
  const [status, setStatus]       = useState('idle') // idle | loading | done | error
  const [lastRun, setLastRun]     = useState(null)

  async function runAnalysis() {
    setStatus('loading')
    setClusters([])

    try {
      const snap = await getDocs(
        query(collection(db, 'complaints'), orderBy('createdAt', 'desc'), limit(100))
      )
      const complaints = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      if (complaints.length === 0) {
        setStatus('idle')
        return
      }

      const res = await fetch('/api/cluster', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ complaints }),
      })
      if (!res.ok) throw new Error('Cluster API failed')

      const { clusters: raw } = await res.json()
      setClusters(raw)
      setChartData(
        raw
          .sort((a, b) => b.count - a.count)
          .map(c => ({ name: c.theme.length > 30 ? c.theme.slice(0, 30) + '…' : c.theme, count: c.count, severity: c.severity }))
      )
      setLastRun(new Date())
      setStatus('done')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  useEffect(() => {
    runAnalysis()
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <p className="text-gray-500 text-sm">
            {lastRun ? `AI-clustered themes · Last updated ${lastRun.toLocaleTimeString()}` : 'AI-powered theme clustering across all complaints'}
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={status === 'loading'}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {status === 'loading' ? 'Analyzing…' : 'Re-analyze'}
        </button>
      </div>

      {status === 'loading' && (
        <div className="text-center py-20">
          <div className="inline-flex items-center gap-3 text-gray-500">
            <svg className="w-5 h-5 animate-spin text-brand-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Claude is analyzing complaints…
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm text-center mb-6">
          Analysis failed. Please try again.
        </div>
      )}

      {status === 'done' && clusters.length > 0 && (
        <>
          {/* Bar chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Theme Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ left: -10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={SEVERITY_COLOR[entry.severity] ?? '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cluster cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {clusters.map((cluster, i) => (
              <ClusterCard key={i} cluster={cluster} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
