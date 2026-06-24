import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import ComplaintCard from '../components/ComplaintCard'

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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Complaints</h1>
      <p className="text-gray-500 text-sm mb-6">Track the status of your submitted reports.</p>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          You haven't submitted any complaints yet.
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map(c => <ComplaintCard key={c.id} complaint={c} showUser={false} />)}
        </div>
      )}
    </div>
  )
}
