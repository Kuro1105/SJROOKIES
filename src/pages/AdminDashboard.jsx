import { Fragment, useEffect, useState } from 'react'
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const CATEGORIES = ['All', '시설', '학사', '행정', '기타']
const STATUSES   = ['All', 'open', 'reviewing', 'resolved']
const PRIORITIES = ['All', 'high', 'medium', 'low']

const STATUS_BADGE = {
  open:      'border-brand-300 text-brand-800 bg-brand-50',
  resolved:  'border-green-300 text-green-700 bg-green-50',
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

const STATUS_ACTIONS = [
  { value: 'open',      label: 'Open',      style: 'border-brand-300 text-brand-800 hover:bg-brand-50',   activeStyle: 'bg-brand-800 text-white border-brand-800' },
  { value: 'reviewing', label: 'In Review', style: 'border-amber-300 text-amber-700 hover:bg-amber-50',  activeStyle: 'bg-amber-500 text-white border-amber-500' },
  { value: 'resolved',  label: 'Resolved',  style: 'border-green-300 text-green-700 hover:bg-green-50',  activeStyle: 'bg-green-600 text-white border-green-600' },
]

function AdminComplaintModal({ complaint: c, onClose, onStatusChange }) {
  const [saving, setSaving] = useState(false)

  async function handleStatus(newStatus) {
    if (newStatus === c.status) return
    setSaving(true)
    await onStatusChange(c.id, newStatus)
    setSaving(false)
  }

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
            {c.category && <span className="text-xs font-medium px-3 py-1 rounded-full border border-sand-300 text-gray-500 bg-sand-50">{CATEGORY_LABEL[c.category] ?? c.category}</span>}
            {c.location && <span className="text-xs font-medium px-3 py-1 rounded-full border border-sand-300 text-gray-500 bg-sand-50">{c.location}</span>}
            {c.priority && <span className="text-xs font-medium px-3 py-1 rounded-full border border-sand-300 text-gray-500 bg-sand-50">{c.priority} priority</span>}
            {c.createdAt && <span className="text-xs text-gray-400 px-3 py-1">{timeAgo(c.createdAt)}</span>}
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

          {/* Support count */}
          {(c.likeCount ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 mb-5 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5 text-brand-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {c.likeCount} {c.likeCount === 1 ? 'student supports' : 'students support'} this
            </div>
          )}

          {/* Status action buttons */}
          <div className="border-t border-sand-200 pt-4 mt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Update status</p>
            <div className="flex gap-2">
              {STATUS_ACTIONS.map(a => (
                <button
                  key={a.value}
                  disabled={saving}
                  onClick={() => handleStatus(a.value)}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50 ${
                    c.status === a.value ? a.activeStyle : a.style
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusSection({ title, accent, complaints, onSelect }) {
  const [collapsed, setCollapsed] = useState(false)
  if (complaints.length === 0) return null
  return (
    <div className="mb-8">
      <button
        onClick={() => setCollapsed(v => !v)}
        className="flex items-center gap-2.5 mb-3 w-full text-left"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${accent}`} />
        <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">{title}</span>
        <span className="text-xs text-gray-400 font-medium">({complaints.length})</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 ml-auto transition-transform ${collapsed ? '-rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {!collapsed && (
        <div className="bg-white border border-sand-300 rounded-2xl overflow-hidden">
          {complaints.map((c, i) => (
            <div
              key={c.id}
              onClick={() => onSelect(c)}
              className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-sand-50 transition-colors ${i > 0 ? 'border-t border-sand-100' : ''}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[c.priority] ?? 'bg-gray-300'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{c.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {CATEGORY_LABEL[c.category] ?? c.category}
                  {c.location ? ` · ${c.location}` : ''}
                  {c.createdAt ? ` · ${timeAgo(c.createdAt)}` : ''}
                </p>
              </div>
              {(c.likeCount ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                  <svg className="w-3 h-3 text-brand-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {c.likeCount}
                </span>
              )}
              <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_BADGE[c.status] ?? 'border-gray-200 text-gray-500 bg-gray-50'}`}>
                {STATUS_LABEL[c.status] ?? c.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([])
  const [filterCat,  setFilterCat]  = useState('All')
  const [filterStat, setFilterStat] = useState('All')
  const [filterPri,  setFilterPri]  = useState('All')
  const [search,     setSearch]     = useState('')
  const [selected,   setSelected]   = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  // Keep modal in sync with live updates
  useEffect(() => {
    if (!selected) return
    const updated = complaints.find(c => c.id === selected.id)
    if (updated) setSelected(updated)
  }, [complaints])

  async function handleStatusChange(id, newStatus) {
    await updateDoc(doc(db, 'complaints', id), {
      status:          newStatus,
      statusUpdatedAt: serverTimestamp(),
    })
  }

  const filtered = complaints.filter(c => {
    if (filterCat  !== 'All' && c.category !== filterCat)  return false
    if (filterStat !== 'All' && c.status   !== filterStat) return false
    if (filterPri  !== 'All' && c.priority !== filterPri)  return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
                  !c.description?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const open      = filtered.filter(c => c.status === 'open')
  const reviewing = filtered.filter(c => c.status === 'reviewing')
  const resolved  = filtered.filter(c => c.status === 'resolved')

  const counts = {
    open:      complaints.filter(c => c.status === 'open').length,
    reviewing: complaints.filter(c => c.status === 'reviewing').length,
    resolved:  complaints.filter(c => c.status === 'resolved').length,
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold text-brand-800 uppercase tracking-widest mb-1.5">Admin Panel</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Manage Reports</h1>
        <p className="text-gray-400 text-sm mt-1">Click any report to open it and update its status.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Open',      count: counts.open,      color: 'text-brand-800' },
          { label: 'In Review', count: counts.reviewing, color: 'text-amber-600' },
          { label: 'Resolved',  count: counts.resolved,  color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-sand-300 rounded-2xl px-6 py-5">
            <p className={`text-4xl font-extrabold leading-none ${s.color}`}>{s.count}</p>
            <p className="text-sm text-gray-400 mt-2">{s.label}</p>
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
        <FilterPills label="Category" options={CATEGORIES} value={filterCat}  onChange={setFilterCat} />
        <FilterPills label="Priority" options={PRIORITIES}  value={filterPri}  onChange={setFilterPri} />
      </div>

      {/* Sections */}
      <StatusSection title="Open"      accent="bg-brand-800" complaints={open}      onSelect={setSelected} />
      <StatusSection title="In Review" accent="bg-amber-400" complaints={reviewing} onSelect={setSelected} />
      <StatusSection title="Resolved"  accent="bg-green-500" complaints={resolved}  onSelect={setSelected} />

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-16">No reports match the current filters.</p>
      )}

      {selected && (
        <AdminComplaintModal
          complaint={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}

function FilterPills({ label, options, value, onChange }) {
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
          {o}
        </button>
      ))}
    </div>
  )
}
