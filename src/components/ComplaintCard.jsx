const PRIORITY_STYLES = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-green-100 text-green-700',
}

const STATUS_STYLES = {
  open:     'bg-blue-100 text-blue-700',
  resolved: 'bg-gray-100 text-gray-600',
  reviewing:'bg-purple-100 text-purple-700',
}

function timeAgo(ts) {
  if (!ts) return ''
  const seconds = Math.floor((Date.now() - ts.toMillis()) / 1000)
  if (seconds < 60)   return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function ComplaintCard({ complaint: c, showUser = true }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{c.title}</h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[c.priority] ?? 'bg-gray-100 text-gray-500'}`}>
            {c.priority}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {c.status}
          </span>
        </div>
      </div>

      {c.summary && (
        <p className="text-gray-500 text-xs mb-3 leading-relaxed">{c.summary}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
        <span className="bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">{c.category}</span>
        {c.location && <span>{c.location}</span>}
        {(c.tags ?? []).map(t => (
          <span key={t} className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">#{t}</span>
        ))}
        <span className="ml-auto">{timeAgo(c.createdAt)}</span>
        {showUser && c.userEmail && (
          <span className="text-gray-300">· {c.userEmail}</span>
        )}
      </div>
    </div>
  )
}
