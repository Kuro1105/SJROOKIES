import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { findMatchingCluster, updateCentroid } from '../lib/clustering'

const LOCATIONS = ['Library', 'Cafeteria', 'Dormitory', 'Lecture Hall', 'Lab', 'Sports Facility', 'Parking', 'Admin Office', 'Other']
const ACTIONABLE_TYPE = '요청형'
const MIN_COUNT_FOR_SOLUTION = 2

async function attachToCluster(complaintRef, form, ai) {
  const embedRes = await fetch('/api/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `${form.title}\n${form.description}` }),
  })
  if (!embedRes.ok) throw new Error('Embedding failed')
  const { embedding } = await embedRes.json()

  const clustersSnap = await getDocs(collection(db, 'clusters'))
  const clusters = clustersSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  const match = findMatchingCluster(embedding, clusters)

  let clusterId
  let newCount
  if (match) {
    newCount = match.complaintCount + 1
    await updateDoc(doc(db, 'clusters', match.id), {
      centroidEmbedding: updateCentroid(match.centroidEmbedding, embedding, match.complaintCount),
      complaintCount: newCount,
    })
    clusterId = match.id
  } else {
    const newCluster = await addDoc(collection(db, 'clusters'), {
      label: form.title,
      centroidEmbedding: embedding,
      complaintCount: 1,
      suggestedSolution: null,
      createdAt: serverTimestamp(),
    })
    clusterId = newCluster.id
    newCount = 1
  }

  await updateDoc(complaintRef, { clusterId, embedding })

  // 단발성 요구사항에는 해결방안을 만들지 않고, 반복 확인된(2건 이상) 경우에만 제안
  if (newCount >= MIN_COUNT_FOR_SOLUTION) {
    const clusterComplaintsSnap = await getDocs(
      query(collection(db, 'complaints'), where('clusterId', '==', clusterId))
    )
    const texts = clusterComplaintsSnap.docs.map((d) => d.data().description)
    const solutionRes = await fetch('/api/solution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, count: newCount }),
    })
    if (solutionRes.ok) {
      const { solution } = await solutionRes.json()
      await updateDoc(doc(db, 'clusters', clusterId), { suggestedSolution: solution })
    }
  }
}

const PRIORITY_BADGE = {
  low:    'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high:   'bg-brand-100 text-brand-800 border-brand-200',
}

export default function Submit() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]     = useState({ title: '', description: '', location: '' })
  const [photos, setPhotos] = useState([])
  const [status, setStatus] = useState('idle')
  const [aiResult, setAiResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  function handlePhotos(e) {
    const files = Array.from(e.target.files)
    setPhotos(prev => [...prev, ...files].slice(0, 5))
  }

  function removePhoto(index) {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadPhotos(complaintId) {
    const urls = await Promise.all(
      photos.map(file => {
        const storageRef = ref(storage, `complaints/${complaintId}/${Date.now()}_${file.name}`)
        return uploadBytes(storageRef, file).then(snap => getDownloadURL(snap.ref))
      })
    )
    return urls
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('classifying')
    setAiResult(null)
    setErrorMsg('')

    try {
      const classifyRes = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, description: form.description }),
      })
      if (!classifyRes.ok) {
        const body = await classifyRes.json().catch(() => ({}))
        throw new Error(`Classification failed (${classifyRes.status}): ${body.error ?? 'unknown'}`)
      }
      const ai = await classifyRes.json()
      setAiResult(ai)
      setStatus('saving')

      const complaintRef = await addDoc(collection(db, 'complaints'), {
        title:       form.title,
        description: form.description,
        location:    form.location,
        userId:      user.uid,
        status:      'open',
        category:    ai.category,
        priority:     ai.priority,
        basePriority: ai.priority,
        likeCount:    0,
        likedBy:      [],
        sentiment:    ai.sentiment,
        type:         ai.type,
        summary:      ai.summary,
        tags:         ai.tags ?? [],
        clusterId:    null,
        photoURLs:    [],
        createdAt:    serverTimestamp(),
      })

      if (photos.length > 0) {
        const photoURLs = await uploadPhotos(complaintRef.id)
        await updateDoc(complaintRef, { photoURLs })
      }

      // 3. 요청형(actionable)만 임베딩 -> 클러스터 매칭/생성 -> (2건 이상이면) 해결방안 제안
      if (ai.type === ACTIONABLE_TYPE) {
        await attachToCluster(complaintRef, form, ai)
      }

      setStatus('done')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message ?? 'Unknown error')
      setStatus('error')
    }
  }

  const isSubmitting = status === 'classifying' || status === 'saving'
  const inputClass = "w-full border border-sand-300 rounded-xl px-4 py-2.5 text-sm bg-sand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-gray-400"

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">

      <div className="mb-8">
        <p className="text-xs font-bold text-brand-800 uppercase tracking-widest mb-1.5">New Report</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Submit a Report</h1>
        <p className="text-gray-400 text-sm mt-1">Your report is automatically classified by AI and routed to the responsible team.</p>
      </div>

      <div className="bg-white rounded-2xl border border-sand-300 overflow-hidden">
        <div className="h-1 bg-brand-800" />

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Report Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Brief summary of the issue"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
            <select
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">Select a location…</option>
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Describe the issue in detail — what happened, when, and the impact it had."
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Photos <span className="font-normal text-gray-400">(optional)</span></label>
            <div className="flex gap-3">
              <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-sand-300 rounded-xl py-5 px-3 cursor-pointer hover:border-brand-400 hover:bg-sand-50 transition-colors">
                <svg className="w-6 h-6 text-gray-300 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-gray-400 text-center">Choose from gallery</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
              </label>
              <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-sand-300 rounded-xl py-5 px-3 cursor-pointer hover:border-brand-400 hover:bg-sand-50 transition-colors">
                <svg className="w-6 h-6 text-gray-300 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs text-gray-400 text-center">Take a photo</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotos} />
              </label>
            </div>
            <p className="text-xs text-gray-300 mt-2">Photos will be visible to everyone who views this report.</p>

            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {photos.map((file, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-sand-300 shrink-0">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {aiResult && status !== 'error' && (
            <div className="bg-brand-100/40 border border-brand-200 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-brand-800 rounded flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.344.344a3.999 3.999 0 01-1.197.818L12 21l-1.656-.738a4 4 0 01-1.197-.818l-.344-.344z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-brand-800">AI Classification</p>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{aiResult.summary}</p>
              <div className="flex flex-wrap gap-2">
                <span className={`border px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800 border-brand-200`}>
                  {aiResult.category}
                </span>
                <span className={`border px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_BADGE[aiResult.priority]}`}>
                  {aiResult.priority} priority
                </span>
                {(aiResult.tags ?? []).map(t => (
                  <span key={t} className="bg-sand-200 text-gray-500 px-2 py-0.5 rounded-full text-xs">#{t}</span>
                ))}
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Report submitted. Redirecting to dashboard…
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <p className="font-semibold">Something went wrong. Please try again.</p>
              {errorMsg && <p className="mt-1 text-xs opacity-80 break-all">{errorMsg}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || status === 'done'}
            className="w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            )}
            {status === 'classifying' && 'Analyzing with AI…'}
            {status === 'saving'      && 'Saving report…'}
            {status === 'done'        && 'Submitted!'}
            {(status === 'idle' || status === 'error') && 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  )
}
