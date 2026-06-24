import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

const SEEN_KEY = 'notif_seen_at'

const STATUS_CONFIG = {
  reviewing: {
    label: 'In Review',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    message: 'Your report has been accepted and is currently being reviewed by the admin team.',
  },
  resolved: {
    label: 'Resolved',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconColor: 'text-green-500',
    badge: 'bg-green-100 text-green-700',
    message: 'Great news! Your report has been resolved by the admin team.',
  },
}

function timeAgo(ts) {
  if (!ts) return ''
  const s = Math.floor((Date.now() - ts.toMillis()) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function Notifications() {
  const { user } = useAuth()
  const [updates, setUpdates]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [seenAt,  setSeenAt]    = useState(() => {
    const v = localStorage.getItem(SEEN_KEY)
    return v ? parseInt(v, 10) : 0
  })

  useEffect(() => {
    // No orderBy in Firestore — sort client-side to avoid composite index requirement
    const q = query(
      collection(db, 'complaints'),
      where('userId', '==', user.uid),
      where('status', 'in', ['reviewing', 'resolved']),
    )
    return onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      docs.sort((a, b) => {
        const ta = a.statusUpdatedAt?.toMillis() ?? a.createdAt?.toMillis() ?? 0
        const tb = b.statusUpdatedAt?.toMillis() ?? b.createdAt?.toMillis() ?? 0
        return tb - ta
      })
      setUpdates(docs)
      setLoading(false)
    })
  }, [user.uid])

  // Save "seen at" when leaving the page, not on arrival — so New badges stay visible
  useEffect(() => {
    return () => {
      localStorage.setItem(SEEN_KEY, String(Date.now()))
    }
  }, [])

  function isNew(item) {
    if (!item.statusUpdatedAt) return false
    return item.statusUpdatedAt.toMillis() > seenAt
  }

  const newCount = updates.filter(isNew).length

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">

      <div className="mb-8">
        <p className="text-xs font-bold text-brand-800 uppercase tracking-widest mb-1.5">Updates</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Notifications</h1>
        <p className="text-gray-400 text-sm mt-1">
          Status updates from the admin team on your submitted reports.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">Loading…</div>
      ) : updates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sand-300 p-12 text-center">
          <div className="w-12 h-12 bg-sand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="font-bold text-gray-900 mb-1">No updates yet</p>
          <p className="text-gray-400 text-sm mb-5">
            You'll be notified here when the admin updates the status of your reports.
          </p>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Submit a report
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map(item => {
            const cfg     = STATUS_CONFIG[item.status]
            const isUnread = isNew(item)
            if (!cfg) return null
            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-5 transition-all ${cfg.bg} ${cfg.border} ${isUnread ? 'ring-2 ring-offset-1 ring-brand-300' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${cfg.iconColor} bg-white/60`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      {isUnread && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-800 text-white">
                          New
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {item.statusUpdatedAt ? timeAgo(item.statusUpdatedAt) : timeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm mb-1 truncate">{item.title}</p>
                    <p className="text-sm text-gray-600">{cfg.message}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
