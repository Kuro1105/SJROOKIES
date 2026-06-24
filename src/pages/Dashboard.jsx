import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot, limit, doc, updateDoc, arrayUnion, increment } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import ComplaintCard from '../components/ComplaintCard'

const CATEGORIES = ['All', '시설', '학사', '행정', '기타']
const PRIORITIES  = ['All', 'high', 'medium', 'low']

const PRIORITY_ORDER = ['low', 'medium', 'high']

const PRIORITY_DOT = {
  high:   'bg-brand-800',
  medium: 'bg-amber-400',
  low:    'bg-sand-400',
}

const STATUS_BADGE = {
  open:      'border-brand-300 text-brand-800 bg-brand-50',
  resolved:  'border-sand-400 text-gray-500 bg-sand-50',
  reviewing: 'border-amber-300 text-amber-700 bg-amber-50',
}

const STATUS_LABEL = {
  open:      'Open',
  resolved:  'Resolved',
  reviewing: 'In review',
}

function computePriority(base, likeCount) {
  const idx = PRIORITY_ORDER.indexOf(base)
  if (idx === -1) return base
  return PRIORITY_ORDER[Math.min(idx + Math.floor(likeCount / 5), 2)]
}

function timeAgo(ts) {
  if (!ts) return ''
  const seconds = Math.floor((Date.now() - ts.toMillis()) / 1000)
  if (seconds < 60)    return 'just now'
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function ComplaintModal({ complaint: c, onClose, onLike, hasLiked }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-1 bg-brand-800 rounded-t-2xl" />

        <div className="p-6">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${PRIORITY_DOT[c.priority] ?? 'bg-gray-300'}`} />
              <h2 className="text-lg font-bold text-gray-900 leading-snug">{c.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-7 h-7 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${STATUS_BADGE[c.status] ?? 'border-gray-200 text-gray-500 bg-gray-50'}`}>
              {STATUS_LABEL[c.status] ?? c.status}
            </span>
            {c.category && (
              <span className="text-xs font-medium px-3 py-1 rounded-full border border-sand-300 text-gray-500 bg-sand-50">
                {c.category}
              </span>
            )}
            {c.location && (
              <span className="text-xs font-medium px-3 py-1 rounded-full border border-sand-300 text-gray-500 bg-sand-50">
                {c.location}
              </span>
            )}
            {c.priority && (
              <span className="text-xs font-medium px-3 py-1 rounded-full border border-sand-300 text-gray-500 bg-sand-50">
                {c.priority} priority
              </span>
            )}
            {c.createdAt && (
              <span className="text-xs text-gray-400 px-3 py-1">
                {timeAgo(c.createdAt)}
              </span>
            )}
          </div>

          {/* Description */}
          {c.description && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.description}</p>
            </div>
          )}

          {/* AI summary */}
          {c.summary && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs font-semibold text-brand-700 mb-1">AI Summary</p>
              <p className="text-sm text-gray-600 leading-relaxed">{c.summary}</p>
            </div>
          )}

          {/* Tags */}
          {c.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {c.tags.map(t => (
                <span key={t} className="bg-sand-100 text-gray-400 px-2 py-0.5 rounded-full text-xs">#{t}</span>
              ))}
            </div>
          )}

          {/* Like button */}
          <div className="border-t border-sand-200 pt-4 mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {(c.likeCount ?? 0) > 0
                ? `${c.likeCount} ${c.likeCount === 1 ? 'person supports' : 'people support'} this report`
                : 'Be the first to support this report'}
            </p>
            <button
              onClick={onLike}
              disabled={hasLiked}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                hasLiked
                  ? 'bg-brand-800 text-white border-brand-800 cursor-default'
                  : 'bg-white text-brand-800 border-brand-300 hover:bg-brand-50'
              }`}
            >
              <svg className="w-4 h-4" fill={hasLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {hasLiked ? 'Supported' : 'Support'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user }                        = useAuth()
  const [complaints, setComplaints]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [catFilter, setCatFilter]       = useState('All')
  const [priFilter, setPriFilter]       = useState('All')
  const [selectedId, setSelectedId]     = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'), limit(100))
    const unsub = onSnapshot(q, snap => {
      setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const selected = complaints.find(c => c.id === selectedId) ?? null

  async function handleLike() {
    if (!selected || !user) return
    if ((selected.likedBy ?? []).includes(user.uid)) return
    const newLikeCount = (selected.likeCount ?? 0) + 1
    const base = selected.basePriority ?? selected.priority
    const newPriority = computePriority(base, newLikeCount)
    await updateDoc(doc(db, 'complaints', selected.id), {
      likeCount: increment(1),
      likedBy:   arrayUnion(user.uid),
      priority:  newPriority,
    })
  }

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
          {visible.map(c => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              showUser={false}
              onClick={() => setSelectedId(c.id)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <ComplaintModal
          complaint={selected}
          onClose={() => setSelectedId(null)}
          onLike={handleLike}
          hasLiked={(selected.likedBy ?? []).includes(user?.uid)}
        />
      )}
    </div>
  )
}
