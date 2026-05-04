'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

const SESSION_KEY = 'este_master_auth'
const MASTER_PASSWORD = process.env.NEXT_PUBLIC_MASTER_PASSWORD || 'este2026'

export default function MasterLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      router.replace('/master/dashboard')
    }
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === MASTER_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      router.replace('/master/dashboard')
    } else {
      setError(true)
      setShake(true)
      setPassword('')
      setTimeout(() => setShake(false), 600)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className={`w-full max-w-md ${shake ? 'animate-shake' : 'animate-fade-in'}`}>
        {/* ブランド */}
        <div className="flex flex-col items-center mb-8">
          <svg className="w-9 h-9 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ color: 'var(--burgundy)' }}>
            <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z" />
          </svg>
          <div className="font-serif text-3xl font-semibold tracking-[0.18em]" style={{ color: 'var(--burgundy)' }}>
            Esté Premium
          </div>
          <div className="text-[9px] font-semibold tracking-[0.4em] uppercase mt-2" style={{ color: 'var(--text-3)' }}>
            Cast SNS Atelier
          </div>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="pd-card-feature p-7">
          <div className="font-serif text-lg font-semibold text-center mb-6 tracking-[0.06em]" style={{ color: 'var(--burgundy)' }}>
            Master Access
          </div>

          <div className="mb-4">
            <label className="pd-label">パスワード</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false) }}
                placeholder="••••••••"
                autoFocus
                className="pd-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-3)' }}
                aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-1.5 mt-2.5">
                <AlertCircle size={12} style={{ color: 'var(--rose-status)' }} />
                <span className="text-xs" style={{ color: 'var(--rose-status)' }}>
                  パスワードが違います
                </span>
              </div>
            )}
          </div>

          <button type="submit" disabled={!password} className="pd-btn pd-btn-primary w-full mt-2 disabled:opacity-40 disabled:cursor-not-allowed" style={{ fontFamily: 'var(--f-serif)', fontSize: '14px', letterSpacing: '0.18em', textTransform: 'none' }}>
            Sign In
          </button>
        </form>

        <div className="text-center mt-6 text-[10px] tracking-[0.18em] uppercase" style={{ color: 'var(--text-3)' }}>
          このページはオーナー専用です
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) }
          20% { transform: translateX(-8px) }
          40% { transform: translateX(8px) }
          60% { transform: translateX(-6px) }
          80% { transform: translateX(6px) }
        }
        .animate-shake { animation: shake 0.5s ease both; }
      `}</style>
    </div>
  )
}
