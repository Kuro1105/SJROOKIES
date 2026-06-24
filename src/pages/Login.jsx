import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ChatBubbleLogo } from '../components/Navbar'

export default function Login() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()

  const [studentId, setStudentId] = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { profile } = await signIn(studentId.trim(), password)
      navigate(profile?.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      setError('Invalid student ID or password.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent bg-white placeholder-gray-400'

  return (
    <div className="min-h-screen flex">

      {/* Left — crimson panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] p-10"
        style={{ backgroundColor: '#8B1A2E' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#701426' }}>
            <ChatBubbleLogo className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Campus Voice</p>
            <p className="text-white/50 text-xs">Student Reporting Platform</p>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Your voice shapes<br />a better campus.
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Report issues, track progress, and see your university improve — powered by AI that routes every report to the right team.
          </p>
        </div>

        <div />
      </div>

      {/* Right — sign in */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: '#f5f2ea' }}>
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#8B1A2E' }}>
              <ChatBubbleLogo className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold" style={{ color: '#8B1A2E' }}>Campus Voice</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-8">Sign in with your student ID and password.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Student ID</label>
              <input
                type="text"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                placeholder="e.g. 20231001"
                required
                autoFocus
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-60"
              style={{ backgroundColor: '#8B1A2E' }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Trouble logging in? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
