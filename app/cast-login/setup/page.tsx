'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react'

type Step = 'id' | 'name' | 'password'

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('id')
  const [loginId, setLoginId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [castId, setCastId] = useState('')

  // STEP1: IDが存在するか確認のみ（セットアップしない）
  const handleCheckId = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginId.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/cast-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_id', login_id: loginId.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setCastId(data.cast_id)
      setStep('name')
    } finally { setLoading(false) }
  }

  // STEP2: 名前を入力してSTEP3へ
  const handleNameNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) { setError('在籍名を入力してください'); return }
    setError(''); setStep('password')
  }

  // STEP3: パスワード設定 → 完了
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('パスワードが一致しません'); return }
    if (password.length < 6) { setError('パスワードは6文字以上にしてください'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/cast-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup', cast_id: castId, display_name: displayName, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setDone(true)
      sessionStorage.setItem('cast_auth', JSON.stringify({
        cast_id: castId, display_name: displayName,
      }))
      setTimeout(() => router.push('/cast-login/sns'), 1500)
    } finally { setLoading(false) }
  }

  if (done) return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle2 size={32} className="text-green-500" />
      </div>
      <h2 className="text-lg font-semibold text-stone-800 mb-2">設定完了！</h2>
      <p className="text-sm text-stone-500">SNS連携ページに移動します...</p>
    </div>
  )

  const steps: Step[] = ['id', 'name', 'password']
  const stepIdx = steps.indexOf(step)
  const stepLabels = ['ID確認', '名前入力', 'PW設定']

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex flex-col">
      <div className="pt-14 pb-5 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center mx-auto mb-3 shadow-sm">
          <Zap size={20} className="text-white" />
        </div>
        <h1 className="text-lg font-semibold text-stone-800">初回セットアップ</h1>
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center justify-center gap-2 mb-6 px-6">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < stepIdx ? 'bg-green-500 text-white' : i === stepIdx ? 'bg-rose-500 text-white' : 'bg-stone-200 text-stone-400'
              }`}>
                {i < stepIdx ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] whitespace-nowrap ${i === stepIdx ? 'text-rose-600 font-medium' : 'text-stone-400'}`}>{label}</span>
            </div>
            {i < 2 && <div className="w-8 h-px bg-stone-200 mb-3" />}
          </div>
        ))}
      </div>

      <div className="flex-1 px-6">
        <div className="max-w-sm mx-auto">

          {/* STEP 1: ID確認 */}
          {step === 'id' && (
            <form onSubmit={handleCheckId} className="space-y-4">
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                <p className="text-sm text-amber-700 font-medium">オーナーから受け取ったIDを入力</p>
                <p className="text-xs text-amber-600 mt-0.5">例: 00001</p>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-600 block mb-2">ログインID</label>
                <input type="text" value={loginId} onChange={e => { setLoginId(e.target.value); setError('') }}
                  placeholder="00001" autoCapitalize="none" inputMode="numeric"
                  className="w-full border border-stone-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-rose-400 transition-colors text-stone-700 placeholder-stone-300 bg-white text-center text-2xl font-mono tracking-widest"
                  style={{ fontSize: '24px' }} />
              </div>
              {error && <Err msg={error} />}
              <button type="submit" disabled={!loginId.trim() || loading}
                className="w-full bg-rose-500 text-white text-base font-medium py-4 rounded-2xl hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-40">
                {loading ? '確認中...' : '次へ'}
              </button>
              <a href="/cast-login" className="flex items-center justify-center gap-1 text-sm text-stone-400 pt-2">
                <ChevronLeft size={14} />ログイン画面に戻る
              </a>
            </form>
          )}

          {/* STEP 2: 在籍名入力 */}
          {step === 'name' && (
            <form onSubmit={handleNameNext} className="space-y-4">
              <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                <p className="text-sm text-rose-700 font-medium">ようこそ✨ 在籍名を入力してください</p>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-600 block mb-1.5">在籍名</label>
                <input type="text" value={displayName} onChange={e => { setDisplayName(e.target.value); setError('') }}
                  placeholder="在籍名を入力"
                  className="w-full border border-stone-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-rose-400 transition-colors text-stone-700 placeholder-stone-300 bg-white"
                  style={{ fontSize: '16px' }} />
                <div className="mt-3 bg-stone-50 rounded-xl p-3.5 border border-stone-100">
                  <p className="text-xs text-stone-500 font-medium mb-1.5">記入例</p>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    ・1店舗 → <span className="text-stone-700 font-medium">〇〇エステ さくら</span><br />
                    ・2店舗 → <span className="text-stone-700 font-medium">〇〇エステ さくら、△△エステ みお</span><br />
                    <span className="text-stone-400 text-[11px]">複数店舗は「、」で区切って全部書いてください</span>
                  </p>
                </div>
              </div>
              {error && <Err msg={error} />}
              <button type="submit" disabled={!displayName.trim()}
                className="w-full bg-rose-500 text-white text-base font-medium py-4 rounded-2xl hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-40">
                次へ
              </button>
              <button type="button" onClick={() => { setStep('id'); setError('') }}
                className="flex items-center justify-center gap-1 w-full text-sm text-stone-400 pt-2">
                <ChevronLeft size={14} />戻る
              </button>
            </form>
          )}

          {/* STEP 3: パスワード設定 */}
          {step === 'password' && (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                <p className="text-sm text-rose-700 font-medium">在籍名：{displayName}</p>
                <p className="text-xs text-rose-500 mt-0.5">パスワードを設定してください（6文字以上）</p>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-600 block mb-2">新しいパスワード</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="6文字以上" autoComplete="new-password"
                    className="w-full border border-stone-200 rounded-2xl px-4 py-3.5 pr-12 focus:outline-none focus:border-rose-400 transition-colors text-stone-700 placeholder-stone-300 bg-white"
                    style={{ fontSize: '16px' }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 p-1">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-600 block mb-2">パスワード確認</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError('') }}
                    placeholder="もう一度入力" autoComplete="new-password"
                    className="w-full border border-stone-200 rounded-2xl px-4 py-3.5 pr-12 focus:outline-none focus:border-rose-400 transition-colors text-stone-700 placeholder-stone-300 bg-white"
                    style={{ fontSize: '16px' }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 p-1">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirm && (
                  <p className={`text-xs mt-1.5 ${password === confirm ? 'text-green-600' : 'text-red-500'}`}>
                    {password === confirm ? '✓ 一致しています' : '✗ パスワードが一致しません'}
                  </p>
                )}
              </div>
              {error && <Err msg={error} />}
              <button type="submit" disabled={!password || !confirm || password !== confirm || loading}
                className="w-full bg-rose-500 text-white text-base font-medium py-4 rounded-2xl hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-40">
                {loading ? '設定中...' : 'パスワードを設定する'}
              </button>
              <button type="button" onClick={() => { setStep('name'); setError('') }}
                className="flex items-center justify-center gap-1 w-full text-sm text-stone-400 pt-2">
                <ChevronLeft size={14} />戻る
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function Err({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
      <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
      <span className="text-sm text-red-600">{msg}</span>
    </div>
  )
}
