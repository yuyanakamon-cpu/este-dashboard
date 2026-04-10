'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

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
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className={shake ? 'w-full max-w-sm animate-shake' : 'w-full max-w-sm'}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center mb-3 shadow-sm">
            <Zap size={22} className="text-white" />
          </div>
          <div className="text-lg font-semibold text-stone-800 tracking-tight">ESTE SNS</div>
          <div className="text-xs text-stone-400 mt-0.5">管理者ログイン</div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={14} className="text-stone-400" />
            <span className="text-sm font-medium text-stone-600">マスター管理画面</span>
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium text-stone-500 block mb-1.5">パスワード</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false) }}
                placeholder="パスワードを入力"
                autoFocus
                className="w-full text-sm border border-stone-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-rose-300 transition-colors text-stone-700 placeholder-stone-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-1.5 mt-2">
                <AlertCircle size={12} className="text-red-500" />
                <span className="text-xs text-red-500">パスワードが違います</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!password}
            className="w-full bg-rose-500 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            ログイン
          </button>
        </form>

        <p className="text-center text-[11px] text-stone-300 mt-5">
          このページはオーナー専用です
        </p>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  )
}
