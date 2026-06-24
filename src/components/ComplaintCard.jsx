const PRIORITY_DOT = {
  high:   'bg-brand-800',
  medium: 'bg-amber-400',
  low:    'bg-sand-400',
}

const STATUS_BADGE = {
  open:      'border-brand-300 text-brand-800',
  resolved:  'border-sand-400 text-gray-500',
  reviewing: 'border-amber-300 text-amber-700',
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

export default function ComplaintCard({ complaint: c, showUser = true, onClick }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-sand-300 px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >

      {/* Priority dot */}
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${PRIORITY_DOT[c.priority] ?? 'bg-gray-300'}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{c.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {c.category}
          {c.location ? ` · ${c.location}` : ''}
          {c.createdAt ? ` · ${timeAgo(c.createdAt)}` : ''}
          {c.priority ? ` · ${c.priority} priority` : ''}
          {showUser && c.userEmail ? ` · ${c.userEmail}` : ''}
        </p>
      </div>

      {/* Status badge */}
      <span className={`shrink-0 text-xs font-medium px-3 py-1 rounded-full border ${STATUS_BADGE[c.status] ?? 'border-gray-200 text-gray-500'}`}>
        {STATUS_LABEL[c.status] ?? c.status}
      </span>
    </div>
  )
}
