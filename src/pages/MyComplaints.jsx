import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import ComplaintCard from '../components/ComplaintCard'
import { Link } from 'react-router-dom'

export default function MyComplaints() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)

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
          {complaints.map(c => <ComplaintCard key={c.id} complaint={c} showUser={false} />)}
        </div>
      )}
    </div>
  )
}
