'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react'

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

      // セッションに保存
      sessionStorage.setItem('cast_auth', JSON.stringify({
        cast_id: data.cast_id,
        cast_name: data.cast_name,
        sns_status: data.sns_status,
      }))

      // SNS接続ページへ
      router.push('/cast-login/sns')

    } catch {
      setError('通信エラーが発生しました')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex flex-col">
      {/* ヘッダー */}
      <div className="pt-16 pb-8 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Zap size={24} className="text-white" />
        </div>
        <h1 className="text-xl font-semibold text-stone-800">ESTE SNS</h1>
        <p className="text-sm text-stone-400 mt-1">セラピストログイン</p>
      </div>

      {/* フォーム */}
      <div className={`flex-1 px-6 ${shake ? 'animate-[shake_0.5s_ease]' : ''}`}>
        <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4">

          <div>
            <label className="text-sm font-medium text-stone-600 block mb-2">ログインID</label>
            <input
              type="text"
              value={loginId}
              onChange={e => { setLoginId(e.target.value); setError('') }}
              placeholder="例: sakura_2847"
              autoComplete="username"
              autoCapitalize="none"
              className="w-full text-base border border-stone-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-rose-400 transition-colors text-stone-700 placeholder-stone-300 bg-white"
              style={{ fontSize: '16px' }}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-600 block mb-2">パスワード</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="パスワードを入力"
                autoComplete="current-password"
                className="w-full text-base border border-stone-200 rounded-2xl px-4 py-3.5 pr-12 focus:outline-none focus:border-rose-400 transition-colors text-stone-700 placeholder-stone-300 bg-white"
                style={{ fontSize: '16px' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 p-1"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
              <AlertCircle size={15} className="text-red-500 shrink-0" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!loginId || !password || loading}
            className="w-full bg-rose-500 text-white text-base font-medium py-4 rounded-2xl hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>

          <p className="text-center text-sm text-stone-400 pt-2">
            初めてログインする方は
            <a href="/cast-login/setup" className="text-rose-500 font-medium ml-1">こちら</a>
          </p>
        </form>
      </div>

      <p className="text-center text-xs text-stone-300 pb-8">
        ログインIDはオーナーから受け取ってください
      </p>

      <style jsx global>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-5px)}
          80%{transform:translateX(5px)}
        }
      `}</style>
    </div>
  )
}
