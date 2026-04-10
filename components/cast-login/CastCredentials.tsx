'use client'

import { useState, useEffect } from 'react'
import type { CastAuth } from '@/lib/auth/cast-auth'
import {
  Copy, CheckCircle2, Eye, EyeOff, KeyRound,
  RefreshCw, Trash2, Plus, ChevronUp
} from 'lucide-react'
import clsx from 'clsx'

const PLATFORM_ICONS: Record<string, string> = {
  x: '𝕏', bluesky: '🦋', threads: '🧵', instagram: '📷',
}
const COLORS = [
  'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700',
  'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700',
  'bg-green-100 text-green-700', 'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700', 'bg-indigo-100 text-indigo-700',
]

interface Props {
  onUpdate?: (casts: CastAuth[]) => void
}

export default function CastCredentials({ onUpdate }: Props) {
  const [credentials, setCredentials] = useState<CastAuth[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [resetTarget, setResetTarget] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [issuing, setIssuing] = useState(false)
  const [showPass, setShowPass] = useState<Record<string, boolean>>({})

  const fetch_ = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cast-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_all' }),
      })
      const data = await res.json()
      const casts = data.credentials ?? []
      setCredentials(casts)
      onUpdate?.(casts)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch_() }, [])

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleIssueNew = async () => {
    setIssuing(true)
    try {
      const res = await fetch('/api/cast-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'issue_new' }),
      })
      const data = await res.json()
      if (data.success) {
        const updated = [...credentials, data.auth].sort((a, b) => (a.cast_number ?? 0) - (b.cast_number ?? 0))
        setCredentials(updated)
        onUpdate?.(updated)
        setExpanded(v => ({ ...v, [data.auth.cast_id]: true }))
      }
    } finally { setIssuing(false) }
  }

  const handleReissue = async (auth: CastAuth) => {
    const name = auth.display_name || `No.${auth.login_id}`
    if (!confirm(`${name}のパスワードをリセットしますか？\n現在のパスワードは無効になります。IDは変わりません。`)) return
    setProcessing(auth.cast_id)
    try {
      const res = await fetch('/api/cast-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reissue_id', cast_id: auth.cast_id }),
      })
      const data = await res.json()
      if (data.success) {
        const updated = credentials.map(c => c.cast_id === auth.cast_id ? data.auth : c)
        setCredentials(updated)
        onUpdate?.(updated)
        setExpanded(v => ({ ...v, [auth.cast_id]: true }))
      }
    } finally { setProcessing(null) }
  }

  const handleDelete = async (auth: CastAuth) => {
    const name = auth.display_name || `No.${auth.login_id}`
    if (!confirm(`${name}を削除しますか？\nログインできなくなります。この操作は元に戻せません。`)) return
    setProcessing(auth.cast_id)
    try {
      await fetch('/api/cast-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', cast_id: auth.cast_id }),
      })
      const updated = credentials.filter(c => c.cast_id !== auth.cast_id)
      setCredentials(updated)
      onUpdate?.(updated)
    } finally { setProcessing(null) }
  }

  const handleResetPassword = async (castId: string) => {
    if (!newPassword || newPassword.length < 6) return
    setResetting(true)
    try {
      await fetch('/api/cast-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', cast_id: castId, new_password: newPassword }),
      })
      await fetch_()
      setResetTarget(null)
      setNewPassword('')
    } finally { setResetting(false) }
  }

  if (loading) return <div className="text-center py-8 text-stone-400 text-sm">読み込み中...</div>

  const nextNumber = credentials.length === 0 ? 1
    : Math.max(...credentials.map(c => c.cast_number ?? 0)) + 1

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={fetch_} className="flex items-center gap-1.5 text-xs text-stone-400 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-50">
            <RefreshCw size={12} />更新
          </button>
          <a href="/cast-login" target="_blank" className="text-xs text-rose-500 border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-50">
            キャストログイン画面 →
          </a>
        </div>
        <button onClick={handleIssueNew} disabled={issuing}
          className="flex items-center gap-2 bg-rose-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-40">
          <Plus size={15} />
          {issuing ? '発行中...' : `ID発行（次は ${String(nextNumber).padStart(5, '0')} 番）`}
        </button>
      </div>

      {credentials.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center">
          <div className="text-4xl mb-3">🌸</div>
          <p className="text-sm text-stone-500 mb-1">まだ登録されていません</p>
          <p className="text-xs text-stone-400">「ID発行」ボタンから最初のIDを作成してください</p>
        </div>
      )}

      <div className="space-y-3">
        {credentials.map((auth, idx) => {
          const isExpanded = expanded[auth.cast_id]
          const isProcessing = processing === auth.cast_id
          const avatarColor = COLORS[idx % COLORS.length]
          const isPwVisible = showPass[auth.cast_id]

          return (
            <div key={auth.cast_id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4">
                <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0', avatarColor)}>
                  {auth.display_name ? auth.display_name.charAt(0) : auth.login_id.slice(-2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-stone-800">{auth.display_name || `No.${auth.login_id}`}</span>
                    <span className="text-xs font-mono text-stone-400">ID: {auth.login_id}</span>
                    {auth.is_setup_complete
                      ? <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1"><CheckCircle2 size={9} />設定済み</span>
                      : <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">PW未設定</span>
                    }
                  </div>
                  {auth.last_login_at && (
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      最終ログイン: {new Date(auth.last_login_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleReissue(auth)} disabled={isProcessing}
                    className="text-xs text-stone-500 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-40 flex items-center gap-1">
                    <RefreshCw size={11} />PW再設定
                  </button>
                  <button onClick={() => setExpanded(v => ({ ...v, [auth.cast_id]: !v[auth.cast_id] }))}
                    className="text-stone-400 hover:text-stone-600 p-1.5">
                    {isExpanded ? <ChevronUp size={16} /> : <Eye size={16} />}
                  </button>
                  <button onClick={() => handleDelete(auth)} disabled={isProcessing}
                    className="text-stone-300 hover:text-red-400 transition-colors p-1.5 disabled:opacity-40">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-stone-50 pt-4 space-y-3">
                  {/* ログインID */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-400 w-28 shrink-0">ログインID</span>
                    <code className="flex-1 text-base font-mono font-bold bg-stone-50 px-4 py-2.5 rounded-xl text-stone-900 tracking-widest">{auth.login_id}</code>
                    <button onClick={() => copy(auth.login_id, `id-${auth.cast_id}`)} className="text-stone-400 hover:text-stone-600 p-1">
                      {copiedKey === `id-${auth.cast_id}` ? <CheckCircle2 size={15} className="text-green-500" /> : <Copy size={15} />}
                    </button>
                  </div>

                  {/* パスワード */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-400 w-28 shrink-0">パスワード</span>
                    {auth.is_setup_complete && auth.password_plain ? (
                      <>
                        <code className="flex-1 text-base font-mono bg-stone-50 px-4 py-2.5 rounded-xl text-stone-900 tracking-wider">
                          {isPwVisible ? auth.password_plain : '●'.repeat(auth.password_plain.length)}
                        </code>
                        <button onClick={() => setShowPass(v => ({ ...v, [auth.cast_id]: !v[auth.cast_id] }))}
                          className="text-stone-400 hover:text-stone-600 p-1">
                          {isPwVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button onClick={() => copy(auth.password_plain, `pw-${auth.cast_id}`)} className="text-stone-400 hover:text-stone-600 p-1">
                          {copiedKey === `pw-${auth.cast_id}` ? <CheckCircle2 size={15} className="text-green-500" /> : <Copy size={15} />}
                        </button>
                      </>
                    ) : auth.is_setup_complete ? (
                      <span className="text-xs text-stone-400 bg-stone-50 px-3 py-2 rounded-xl flex-1">旧データのため表示不可（PW再設定で更新）</span>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl flex-1">まだ設定されていません</span>
                    )}
                  </div>

                  {/* 送る内容 */}
                  <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                    <p className="text-[11px] text-rose-500 font-medium mb-2">📱 女の子に送る内容</p>
                    <div className="bg-white rounded-lg p-3 font-mono text-xs text-stone-800 leading-relaxed border border-rose-100 whitespace-pre-wrap">{`ログインID: ${auth.login_id}
URL: ${typeof window !== 'undefined' ? window.location.origin : ''}/cast-login/setup

↑のURLを開いてIDを入力し、
自分で在籍名とパスワードを設定してください`}</div>
                    <button
                      onClick={() => copy(
                        `ログインID: ${auth.login_id}\nURL: ${window.location.origin}/cast-login/setup\n\n↑のURLを開いてIDを入力し、自分で在籍名とパスワードを設定してください`,
                        `msg-${auth.cast_id}`
                      )}
                      className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                      {copiedKey === `msg-${auth.cast_id}` ? <><CheckCircle2 size={11} className="text-green-500" />コピーしました！</> : <><Copy size={11} />まとめてコピー</>}
                    </button>
                  </div>

                  {/* SNS */}
                  {auth.is_setup_complete && (
                    <div className="flex items-start gap-3">
                      <span className="text-xs text-stone-400 w-28 shrink-0 pt-0.5">SNS接続</span>
                      <div className="flex gap-1.5 flex-wrap flex-1">
                        {(['x', 'bluesky', 'threads', 'instagram'] as const).map(p => {
                          const sns = auth.sns_status?.[p]
                          return (
                            <span key={p} className={clsx('text-[11px] px-2 py-0.5 rounded-lg border flex items-center gap-1',
                              sns?.connected ? 'bg-green-50 text-green-700 border-green-100' : 'bg-stone-50 text-stone-400 border-stone-100')}>
                              <span style={{ fontSize: '12px' }}>{PLATFORM_ICONS[p]}</span>
                              {sns?.connected ? sns.username || '接続済' : '未接続'}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* PWリセット */}
                  {resetTarget === auth.cast_id ? (
                    <div className="flex items-center gap-2">
                      <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="新しいパスワード（6文字以上）"
                        className="flex-1 text-xs border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-rose-300" />
                      <button onClick={() => handleResetPassword(auth.cast_id)}
                        disabled={!newPassword || newPassword.length < 6 || resetting}
                        className="text-xs bg-rose-500 text-white px-3 py-2 rounded-lg disabled:opacity-40">
                        {resetting ? '...' : 'リセット'}
                      </button>
                      <button onClick={() => { setResetTarget(null); setNewPassword('') }} className="text-xs text-stone-400">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setResetTarget(auth.cast_id)}
                      className="flex items-center gap-1 text-xs text-stone-400 hover:text-rose-500 transition-colors">
                      <KeyRound size={11} />パスワードをマスターからリセット
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
