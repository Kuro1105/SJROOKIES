import { Fragment, useEffect, useState } from 'react'
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const CATEGORIES  = ['All', '시설', '학사', '행정', '기타']
const STATUSES    = ['All', 'open', 'reviewing', 'resolved']
const PRIORITIES  = ['All', 'high', 'medium', 'low']

const STATUS_OPTIONS = ['open', 'reviewing', 'resolved']

const STATUS_BADGE = {
  open:      'border-brand-300 text-brand-800 bg-brand-50',
  resolved:  'border-sand-400 text-gray-500 bg-sand-50',
  reviewing: 'border-amber-300 text-amber-700 bg-amber-50',
}
const STATUS_LABEL = { open: 'Open', resolved: 'Resolved', reviewing: 'In review' }

const PRIORITY_DOT = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-green-400',
}

const CATEGORY_LABEL = {
  '시설': 'Facilities',
  '학사': 'Academics',
  '행정': 'Admin',
  '기타': 'Other',
}

function timeAgo(ts) {
  if (!ts) return ''
  const s = Math.floor((Date.now() - ts.toMillis()) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function StatusSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onClick={e => e.stopPropagation()}
      className="text-xs border rounded-lg px-2 py-1 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
      style={{ borderColor: '#d1c9b8', backgroundColor: '#faf8f3' }}
    >
      {STATUS_OPTIONS.map(s => (
        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
      ))}
    </select>
  )
}

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([])
  const [filterCat,  setFilterCat]  = useState('All')
  const [filterStat, setFilterStat] = useState('All')
  const [filterPri,  setFilterPri]  = useState('All')
  const [search,     setSearch]     = useState('')
  const [expanded,   setExpanded]   = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  async function handleStatusChange(id, newStatus) {
    await updateDoc(doc(db, 'complaints', id), { status: newStatus })
  }

  const filtered = complaints.filter(c => {
    if (filterCat  !== 'All' && c.category !== filterCat)   return false
    if (filterStat !== 'All' && c.status   !== filterStat)  return false
    if (filterPri  !== 'All' && c.priority !== filterPri)   return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
                  !c.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = {
    open:      complaints.filter(c => c.status === 'open').length,
    reviewing: complaints.filter(c => c.status === 'reviewing').length,
    resolved:  complaints.filter(c => c.status === 'resolved').length,
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold text-brand-800 uppercase tracking-widest mb-1.5">Admin Panel</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Manage Reports</h1>
        <p className="text-gray-400 text-sm mt-1">Review and update the status of all submitted reports.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Open',       count: counts.open,      color: '#8B1A2E' },
          { label: 'In Review',  count: counts.reviewing, color: '#d97706' },
          { label: 'Resolved',   count: counts.resolved,  color: '#16a34a' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-sand-300 rounded-2xl p-5">
            <p className="text-3xl font-extrabold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search reports…"
          className="border border-sand-300 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-56"
        />
        <FilterBar label="Category" options={CATEGORIES} value={filterCat}  onChange={setFilterCat} />
        <FilterBar label="Status"   options={STATUSES}   value={filterStat} onChange={setFilterStat} />
        <FilterBar label="Priority" options={PRIORITIES}  value={filterPri}  onChange={setFilterPri} />
      </div>

      {/* Table */}
      <div className="bg-white border border-sand-300 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 text-xs uppercase tracking-widest text-gray-400">
                <th className="text-left px-5 py-3 font-semibold">Report</th>
                <th className="text-left px-4 py-3 font-semibold">Category</th>
                <th className="text-left px-4 py-3 font-semibold">Priority</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Submitted</th>
                <th className="text-left px-4 py-3 font-semibold">Votes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">No reports found.</td>
                </tr>
              )}
              {filtered.map(c => (
                <Fragment key={c.id}>
                  <tr
                    className="border-b border-sand-100 hover:bg-sand-50 cursor-pointer transition-colors"
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900 line-clamp-1">{c.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.location}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-gray-600 bg-sand-100 px-2 py-0.5 rounded-full">
                        {CATEGORY_LABEL[c.category] ?? c.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[c.priority]}`} />
                        <span className="capitalize text-gray-700">{c.priority}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusSelect value={c.status} onChange={v => handleStatusChange(c.id, v)} />
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">
                      {timeAgo(c.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">
                      {c.likeCount ?? 0}
                    </td>
                  </tr>

                  {expanded === c.id && (
                    <tr className="bg-sand-50">
                      <td colSpan={6} className="px-5 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Description</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{c.description}</p>
                          </div>
                          <div className="space-y-3">
                            {c.summary && (
                              <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">AI Summary</p>
                                <p className="text-sm text-gray-700">{c.summary}</p>
                              </div>
                            )}
                            {c.tags?.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Tags</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {c.tags.map(t => (
                                    <span key={t} className="text-xs bg-white border border-sand-300 rounded-full px-2 py-0.5 text-gray-500">{t}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Type / Sentiment</p>
                              <p className="text-sm text-gray-600">{c.type} · {c.sentiment}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">{filtered.length} of {complaints.length} reports</p>
    </div>
  )
}

function FilterBar({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 bg-white border border-sand-300 rounded-xl px-3 py-1.5">
      <span className="text-xs text-gray-400 font-medium">{label}:</span>
      {options.map(o => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`text-xs px-2 py-0.5 rounded-lg font-medium transition-colors ${
            value === o ? 'bg-brand-800 text-white' : 'text-gray-500 hover:bg-sand-100'
          }`}
        >
          {o === 'All' ? 'All' : o}
        </button>
      ))}
    </div>
  )
}
