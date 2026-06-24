import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import ComplaintCard from '../components/ComplaintCard'

const CATEGORIES = ['All', '시설', '학사', '행정', '기타']
const PRIORITIES  = ['All', 'high', 'medium', 'low']

export default function Dashboard() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)
  const [catFilter, setCatFilter]   = useState('All')
  const [priFilter, setPriFilter]   = useState('All')

  useEffect(() => {
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'), limit(100))
    const unsub = onSnapshot(q, snap => {
      setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const visible = complaints.filter(c => {
    if (catFilter !== 'All' && c.category !== catFilter) return false
    if (priFilter !== 'All' && c.priority !== priFilter) return false
    return true
  })

  const stats = {
    total:  complaints.length,
    high:   complaints.filter(c => c.priority === 'high').length,
    open:   complaints.filter(c => c.status === 'open').length,
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Live campus issue feed</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Reports',  value: stats.total, color: 'text-brand-600' },
          { label: 'High Priority',  value: stats.high,  color: 'text-red-500' },
          { label: 'Open Issues',    value: stats.open,  color: 'text-yellow-500' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div>
          <label className="text-xs text-gray-500 mr-1">Category</label>
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mr-1">Priority</label>
          <select
            value={priFilter}
            onChange={e => setPriFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Complaint list */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading complaints…</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No complaints match the current filters.</div>
      ) : (
        <div className="space-y-3">
          {visible.map(c => <ComplaintCard key={c.id} complaint={c} />)}
        </div>
      )}
    </div>
  )
}
