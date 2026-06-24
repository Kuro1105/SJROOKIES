import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import ComplaintCard from '../components/ComplaintCard'
import { Link } from 'react-router-dom'

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

function timeAgo(ts) {
  if (!ts) return ''
  const seconds = Math.floor((Date.now() - ts.toMillis()) / 1000)
  if (seconds < 60)    return 'just now'
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function MyComplaintModal({ complaint: c, onClose, onDelete }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1 bg-brand-800 rounded-t-2xl" />

        <div className="p-6">
          {/* Header */}
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

          {/* Delete */}
          <div className="border-t border-sand-200 pt-4 mt-2 flex items-center justify-end gap-3">
            {confirming ? (
              <>
                <p className="text-xs text-gray-400 mr-auto">Are you sure? This cannot be undone.</p>
                <button
                  onClick={() => setConfirming(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-sand-300 text-gray-500 hover:bg-sand-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onDelete}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Yes, delete
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete report
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MyComplaints() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, 'complaints'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [user.uid])

  const selected = complaints.find(c => c.id === selectedId) ?? null

  function handleDelete() {
    if (!selected) return
    setComplaints(prev => prev.filter(c => c.id !== selected.id))
    setSelectedId(null)
    deleteDoc(doc(db, 'complaints', selected.id))
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-bold text-brand-800 uppercase tracking-widest mb-1.5">Your Activity</p>
        <h1 className="text-3xl font-extrabold text-gray-900">My Reports</h1>
        <p className="text-gray-400 text-sm mt-1">Track the status of your submitted reports.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">Loading…</div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sand-300 p-12 text-center">
          <div className="w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-bold text-gray-900 mb-1">No reports yet</p>
          <p className="text-gray-400 text-sm mb-5">You haven't submitted any reports yet.</p>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Submit your first report
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {complaints.map(c => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              showUser={false}
              onClick={() => setSelectedId(c.id)}
            />
          ))}
        </div>
      )}

      {selected && (
        <MyComplaintModal
          complaint={selected}
          onClose={() => setSelectedId(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
