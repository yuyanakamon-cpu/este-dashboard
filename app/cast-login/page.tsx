'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function CastLoginPage() {
  const router = useRouter()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/cast-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', login_id: loginId.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'ログインに失敗しました')
        setShake(true)
        setTimeout(() => setShake(false), 600)
        setPassword('')
        setLoading(false)
        return
      }
      sessionStorage.setItem('cast_auth', JSON.stringify({
        cast_id: data.auth.cast_id,
        display_name: data.auth.display_name,
        sns_status: data.auth.sns_status,
      }))
      router.push('/cast-login/sns')
    } catch {
      setError('通信エラーが発生しました')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* ヘッダー */}
      <div className="pt-16 pb-8 px-6 text-center animate-fade-in">
        <svg className="w-10 h-10 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ color: 'var(--burgundy)' }}>
          <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z" />
        </svg>
        <div className="font-serif text-3xl font-semibold tracking-[0.18em]" style={{ color: 'var(--burgundy)' }}>
          Esté Premium
        </div>
        <div className="text-[9px] tracking-[0.4em] uppercase font-semibold mt-2" style={{ color: 'var(--text-3)' }}>
          Therapist Sign In
        </div>
      </div>

      {/* フォーム */}
      <div className={`flex-1 px-6 ${shake ? 'animate-[shake_0.5s_ease]' : ''}`}>
        <form onSubmit={handleSubmit} className="pd-card-feature max-w-sm mx-auto p-7 space-y-4">
          <div>
            <label className="pd-label">ログインID</label>
            <input
              type="text" value={loginId}
              onChange={e => { setLoginId(e.target.value); setError('') }}
              placeholder="例: 00001"
              autoComplete="username"
              autoCapitalize="none"
              className="pd-input"
              style={{ fontSize: '16px' }}
            />
          </div>

          <div>
            <label className="pd-label">パスワード</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="パスワードを入力"
                autoComplete="current-password"
                className="pd-input pr-12"
                style={{ fontSize: '16px' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--text-3)' }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-pd" style={{ background: 'var(--rose-bg)', border: '1px solid rgba(199,107,107,0.30)' }}>
              <AlertCircle size={15} style={{ color: 'var(--rose-status)' }} />
              <span className="text-sm" style={{ color: 'var(--rose-status)' }}>{error}</span>
            </div>
          )}

          <button type="submit" disabled={!loginId || !password || loading}
                  className="pd-btn pd-btn-primary w-full disabled:opacity-40"
                  style={{ fontFamily: 'var(--f-serif)', fontSize: '14px', letterSpacing: '0.18em', textTransform: 'none', padding: '14px' }}>
            {loading ? 'ログイン中...' : 'Sign In'}
          </button>

          <p className="text-center text-sm pt-1" style={{ color: 'var(--text-3)' }}>
            初めてログインする方は
            <a href="/cast-login/setup" className="font-medium ml-1" style={{ color: 'var(--burgundy)' }}>こちら</a>
          </p>
        </form>
      </div>

      <p className="text-center text-xs pb-8 mt-4 tracking-wider" style={{ color: 'var(--text-3)' }}>
        ログインIDはオーナーから受け取ってください
      </p>

      <style jsx global>{`
        @keyframes shake {
          0%,100% { transform: translateX(0) }
          20% { transform: translateX(-8px) }
          40% { transform: translateX(8px) }
          60% { transform: translateX(-5px) }
          80% { transform: translateX(5px) }
        }
      `}</style>
    </div>
  )
}
