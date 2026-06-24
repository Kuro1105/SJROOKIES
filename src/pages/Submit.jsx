import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'

const LOCATIONS = ['Library', 'Cafeteria', 'Dormitory', 'Lecture Hall', 'Lab', 'Sports Facility', 'Parking', 'Admin Office', 'Other']

export default function Submit() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ title: '', description: '', location: '' })
  const [status, setStatus] = useState('idle') // idle | classifying | saving | done | error
  const [aiResult, setAiResult] = useState(null)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('classifying')
    setAiResult(null)

    try {
      // 1. AI classification
      const classifyRes = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, description: form.description }),
      })
      if (!classifyRes.ok) throw new Error('Classification failed')
      const ai = await classifyRes.json()
      setAiResult(ai)
      setStatus('saving')

      // 2. Save to Firestore
      await addDoc(collection(db, 'complaints'), {
        title:       form.title,
        description: form.description,
        location:    form.location,
        userId:      user.uid,
        userEmail:   user.email,
        userPhoto:   user.photoURL,
        status:      'open',
        category:    ai.category,
        priority:    ai.priority,
        sentiment:   ai.sentiment,
        summary:     ai.summary,
        tags:        ai.tags ?? [],
        createdAt:   serverTimestamp(),
      })

      setStatus('done')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  const PRIORITY_COLOR = { low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-red-100 text-red-700' }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Submit a Complaint</h1>
      <p className="text-gray-500 text-sm mb-6">Your report will be automatically classified by AI and sent to the campus team.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="Brief summary of the issue"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <select
            name="location"
            value={form.location}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">Select a location…</option>
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={5}
            placeholder="Describe the issue in detail — what happened, when, and what impact it had."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        {/* AI preview card */}
        {aiResult && status !== 'error' && (
          <div className="bg-brand-50 border border-brand-100 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium text-brand-700 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.344.344a3.999 3.999 0 01-1.197.818L12 21l-1.656-.738a4 4 0 01-1.197-.818l-.344-.344z" />
              </svg>
              AI Classification
            </p>
            <p className="text-gray-600">{aiResult.summary}</p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full text-xs">{aiResult.category}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLOR[aiResult.priority]}`}>
                {aiResult.priority} priority
              </span>
              {(aiResult.tags ?? []).map(t => (
                <span key={t} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">#{t}</span>
              ))}
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm text-center">
            Complaint submitted successfully. Redirecting to dashboard…
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm text-center">
            Something went wrong. Please try again.
          </div>
        )}

        <button
          type="submit"
          disabled={status !== 'idle' && status !== 'error'}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          {status === 'classifying' && 'Analyzing with AI…'}
          {status === 'saving'      && 'Saving…'}
          {status === 'done'        && 'Submitted!'}
          {(status === 'idle' || status === 'error') && 'Submit Complaint'}
        </button>
      </form>
    </div>
  )
}
