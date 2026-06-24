import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/submit',    label: 'Submit Report' },
  { to: '/insights',  label: 'Insights' },
]

function ChatBubbleLogo({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 22" fill="none" className={className}>
      <path
        d="M21 0H3C1.343 0 0 1.343 0 3v12c0 1.657 1.343 3 3 3h5l4 4 4-4h5c1.657 0 3-1.343 3-3V3c0-1.657-1.343-3-3-3z"
        fill="currentColor"
      />
      <circle cx="8"  cy="9" r="1.8" fill="#8B1A2E" />
      <circle cx="12" cy="9" r="1.8" fill="#8B1A2E" />
      <circle cx="16" cy="9" r="1.8" fill="#8B1A2E" />
    </svg>
  )
}

export { ChatBubbleLogo }

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function handleLogout() {
    setOpen(false)
    await logout()
    navigate('/login')
  }

  const initial  = user?.displayName?.[0] ?? user?.email?.[0] ?? '?'
  const firstName = user?.displayName?.split(' ')[0] ?? 'You'

  return (
    <nav style={{ backgroundColor: '#8B1A2E' }} className="sticky top-0 z-20 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 flex items-center h-14 gap-6">

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0 mr-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#701426' }}>
            <ChatBubbleLogo className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">Campus Voice</span>
        </div>

        {/* Flat nav links */}
        <div className="flex items-center gap-1 flex-1">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-3 py-1 text-xs font-semibold uppercase tracking-widest transition-all ${
                  isActive
                    ? 'text-white border-b-2 border-white pb-0.5'
                    : 'text-white/60 hover:text-white'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* User dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-all hover:bg-white/10"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} className="w-7 h-7 rounded-full" alt="" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                {initial.toUpperCase()}
              </div>
            )}
            <span className="text-white text-sm font-medium">{firstName}</span>
            <svg className={`w-3.5 h-3.5 text-white/60 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-sand-300 overflow-hidden">
              <NavLink
                to="/my-complaints"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-sand-100 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                My reports
              </NavLink>
              <div className="h-px bg-sand-200" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-sm w-full text-left transition-colors hover:bg-red-50"
                style={{ color: '#8B1A2E' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
