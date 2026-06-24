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
    open:      complaints.filter(c => c.status === 'open').length,
    reviewing: complaints.filter(c => c.status === 'reviewing').length,
    resolved:  complaints.filter(c => c.status === 'resolved').length,
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-bold text-brand-800 uppercase tracking-widest mb-1.5">Live Feed</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Campus reports</h1>
        <p className="text-gray-400 text-sm mt-1">All submitted issues, visible to everyone — anonymous by default.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Open issues',  value: stats.open,      color: 'text-brand-800' },
          { label: 'In review',    value: stats.reviewing, color: 'text-gray-900' },
          { label: 'Resolved',     value: stats.resolved,  color: 'text-gray-900' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-sand-300 px-6 py-5">
            <p className={`text-4xl font-extrabold leading-none ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-400 mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</span>
        {PRIORITIES.map(p => (
          <button
            key={p}
            onClick={() => setPriFilter(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              priFilter === p
                ? 'bg-brand-800 text-white border-brand-800'
                : 'bg-white text-gray-500 border-sand-300 hover:border-brand-300'
            }`}
          >
            {p === 'All' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}

        <div className="ml-auto">
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="text-xs border border-sand-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-600"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">Loading reports…</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">No reports match the current filters.</div>
      ) : (
        <div className="space-y-2.5">
          {visible.map(c => <ComplaintCard key={c.id} complaint={c} />)}
        </div>
      )}
    </div>
  )
}
