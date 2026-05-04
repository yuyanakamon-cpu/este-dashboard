'use client'

import { useState, useEffect } from 'react'
import type { CastAuth } from '@/lib/auth/cast-auth'
import {
  Copy, CheckCircle2, Eye, EyeOff, KeyRound,
  RefreshCw, Trash2, Plus, ChevronUp, MessageSquare
} from 'lucide-react'
import clsx from 'clsx'

// SNS アイコン（emoji撤廃）
const PlatformIcon = ({ p, size = 11 }: { p: string; size?: number }) => {
  const icons: Record<string, JSX.Element> = {
    x: (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21l-6.55 7.486L22 22h-6.273l-4.92-6.41L5.13 22H2.37l7.011-8.014L2 2h6.4l4.46 5.864L18.244 2zm-1.1 18h1.706L7.05 4H5.244l11.9 16z"/></svg>),
    bluesky: (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M5.99 4.49C8.79 6.59 11.81 10.85 12 12.16c.19-1.31 3.21-5.57 6.01-7.67 2.02-1.51 5.29-2.68 5.29.97 0 .73-.42 6.13-.66 7.01-.85 3.05-3.97 3.83-6.74 3.36 4.85.83 6.08 3.55 3.41 6.27-5.07 5.16-7.27-1.3-7.84-2.96l-.05-.16c-.27-.81-.57-.81-.84 0l-.05.16C9.96 20.8 7.76 27.26 2.69 22.1.02 19.38 1.25 16.66 6.1 15.83c-2.77.47-5.89-.31-6.74-3.36C-.88 11.59-1.3 6.19-1.3 5.46c0-3.65 3.27-2.48 5.29-.97z"/></svg>),
    threads: (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291.815-.046 1.78-.046 2.736.156-.064-1.46-.31-2.45-.94-3.075-.703-.696-1.804-.956-3.176-.956h-.038c-1.117 0-2.633.157-3.586 1.586l-1.696-1.143c1.38-2.072 3.45-2.503 5.282-2.503h.039c2.116.014 3.798.74 4.998 2.156.973 1.144 1.5 2.704 1.624 4.821.84.358 1.486.852 1.965 1.383 1.097 1.218 1.624 3.078 1.158 4.857-.706 2.694-3.034 4.418-6.287 4.45z"/></svg>),
    instagram: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>),
  }
  return icons[p] || null
}

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

  if (loading) return <div className="text-center py-8 text-sm" style={{ color: 'var(--text-3)' }}>読み込み中...</div>

  const nextNumber = credentials.length === 0 ? 1
    : Math.max(...credentials.map(c => c.cast_number ?? 0)) + 1

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={fetch_} className="pd-btn pd-btn-outline text-xs" style={{ padding: '6px 12px', textTransform: 'none', letterSpacing: 0 }}>
            <RefreshCw size={12} />更新
          </button>
          <a href="/cast-login/setup" target="_blank" className="pd-btn pd-btn-outline text-xs" style={{ padding: '6px 12px', textTransform: 'none', letterSpacing: 0, color: 'var(--burgundy)' }}>
            初回セットアップ画面 →
          </a>
        </div>
        <button onClick={handleIssueNew} disabled={issuing} className="pd-btn pd-btn-primary disabled:opacity-40">
          <Plus size={14} />
          {issuing ? '発行中...' : `ID発行（次は ${String(nextNumber).padStart(5, '0')} 番）`}
        </button>
      </div>

      {credentials.length === 0 && (
        <div className="pd-card p-10 text-center">
          <div className="font-serif text-2xl mb-2" style={{ color: 'var(--burgundy)' }}>—</div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>まだ登録されていません</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>「ID発行」ボタンから最初のIDを作成してください</p>
        </div>
      )}

      <div className="space-y-3">
        {credentials.map((auth) => {
          const isExpanded = expanded[auth.cast_id]
          const isProcessing = processing === auth.cast_id
          const isPwVisible = showPass[auth.cast_id]

          return (
            <div key={auth.cast_id} className="pd-card overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-serif text-base font-semibold shrink-0"
                     style={{ background: 'linear-gradient(135deg, var(--gold-light), var(--gold))', color: 'var(--text-1)' }}>
                  {auth.display_name ? auth.display_name.charAt(0) : auth.login_id.slice(-2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif text-base font-semibold" style={{ color: 'var(--burgundy)' }}>{auth.display_name || `No.${auth.login_id}`}</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>ID: {auth.login_id}</span>
                    {auth.is_setup_complete ? (
                      <span className="pd-badge pd-badge-emerald inline-flex items-center gap-1"><CheckCircle2 size={9} />設定済み</span>
                    ) : (
                      <span className="pd-badge pd-badge-amber">PW未設定</span>
                    )}
                  </div>
                  {auth.last_login_at && (
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                      最終ログイン: {new Date(auth.last_login_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleReissue(auth)} disabled={isProcessing} className="pd-btn pd-btn-outline text-xs disabled:opacity-40" style={{ padding: '6px 10px', textTransform: 'none', letterSpacing: 0 }}>
                    <RefreshCw size={11} />PW再設定
                  </button>
                  <button onClick={() => setExpanded(v => ({ ...v, [auth.cast_id]: !v[auth.cast_id] }))} className="p-1.5 transition-colors" style={{ color: 'var(--text-3)' }}>
                    {isExpanded ? <ChevronUp size={16} /> : <Eye size={16} />}
                  </button>
                  <button onClick={() => handleDelete(auth)} disabled={isProcessing} className="p-1.5 transition-colors disabled:opacity-40" style={{ color: 'var(--text-4)' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                  {/* ログインID */}
                  <div className="flex items-center gap-3">
                    <span className="pd-label w-28 shrink-0 mb-0">ログインID</span>
                    <code className="flex-1 text-base font-mono font-bold px-4 py-2.5 rounded-pd tracking-widest" style={{ background: 'var(--bg-muted)', color: 'var(--burgundy)' }}>{auth.login_id}</code>
                    <button onClick={() => copy(auth.login_id, `id-${auth.cast_id}`)} className="p-1 transition-colors" style={{ color: 'var(--text-3)' }}>
                      {copiedKey === `id-${auth.cast_id}` ? <CheckCircle2 size={15} style={{ color: 'var(--emerald)' }} /> : <Copy size={15} />}
                    </button>
                  </div>

                  {/* パスワード */}
                  <div className="flex items-center gap-3">
                    <span className="pd-label w-28 shrink-0 mb-0">パスワード</span>
                    {auth.is_setup_complete && auth.password_plain ? (
                      <>
                        <code className="flex-1 text-base font-mono px-4 py-2.5 rounded-pd tracking-wider" style={{ background: 'var(--bg-muted)', color: 'var(--text-1)' }}>
                          {isPwVisible ? auth.password_plain : '●'.repeat(auth.password_plain.length)}
                        </code>
                        <button onClick={() => setShowPass(v => ({ ...v, [auth.cast_id]: !v[auth.cast_id] }))} className="p-1" style={{ color: 'var(--text-3)' }}>
                          {isPwVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button onClick={() => copy(auth.password_plain, `pw-${auth.cast_id}`)} className="p-1" style={{ color: 'var(--text-3)' }}>
                          {copiedKey === `pw-${auth.cast_id}` ? <CheckCircle2 size={15} style={{ color: 'var(--emerald)' }} /> : <Copy size={15} />}
                        </button>
                      </>
                    ) : auth.is_setup_complete ? (
                      <span className="text-xs px-3 py-2 rounded-pd flex-1" style={{ background: 'var(--bg-muted)', color: 'var(--text-3)' }}>旧データのため表示不可（PW再設定で更新）</span>
                    ) : (
                      <span className="text-xs px-3 py-2 rounded-pd flex-1" style={{ background: 'var(--amber2-bg)', color: 'var(--amber)' }}>まだ設定されていません</span>
                    )}
                  </div>

                  {/* 送る内容 */}
                  <div className="rounded-pd p-4" style={{ background: 'var(--gold-bg)', border: '1px solid var(--border-gold)' }}>
                    <p className="text-[11px] font-medium mb-2 inline-flex items-center gap-1.5" style={{ color: 'var(--gold-deep)' }}>
                      <MessageSquare size={11} />キャストに送る内容
                    </p>
                    <div className="rounded-pd-sm p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap" style={{ background: 'var(--bg-card)', color: 'var(--text-1)', border: '1px solid var(--border-gold)' }}>{`ログインID: ${auth.login_id}
URL: https://postmagick.com/cast-login/setup

↑のURLを開いてIDを入力し、
自分で在籍名とパスワードを設定してください`}</div>
                    <button onClick={() => copy(`ログインID: ${auth.login_id}\nURL: https://postmagick.com/cast-login/setup\n\n↑のURLを開いてIDを入力し、自分で在籍名とパスワードを設定してください`, `msg-${auth.cast_id}`)}
                            className="mt-2.5 flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--gold-deep)' }}>
                      {copiedKey === `msg-${auth.cast_id}` ? <><CheckCircle2 size={11} style={{ color: 'var(--emerald)' }} />コピーしました！</> : <><Copy size={11} />まとめてコピー</>}
                    </button>
                  </div>

                  {/* SNS */}
                  {auth.is_setup_complete && (
                    <div className="flex items-start gap-3">
                      <span className="pd-label w-28 shrink-0 mb-0 pt-0.5">SNS接続</span>
                      <div className="flex gap-1.5 flex-wrap flex-1">
                        {(['x', 'bluesky', 'threads', 'instagram'] as const).map(p => {
                          const sns = auth.sns_status?.[p]
                          const connected = sns?.connected
                          return (
                            <span key={p} className="text-[11px] px-2 py-1 rounded-pd-sm border flex items-center gap-1.5"
                                  style={{
                                    background: connected ? 'var(--emerald-bg)' : 'var(--bg-soft)',
                                    color: connected ? 'var(--emerald)' : 'var(--text-3)',
                                    borderColor: connected ? 'rgba(92,140,111,0.3)' : 'var(--border-soft)',
                                  }}>
                              <PlatformIcon p={p} size={11} />
                              {connected ? sns?.username || '接続済' : '未接続'}
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
                             placeholder="新しいパスワード（6文字以上）" className="pd-input flex-1 text-xs" style={{ padding: '8px 12px' }} />
                      <button onClick={() => handleResetPassword(auth.cast_id)} disabled={!newPassword || newPassword.length < 6 || resetting}
                              className="pd-btn pd-btn-primary text-xs disabled:opacity-40" style={{ padding: '8px 14px' }}>
                        {resetting ? '...' : 'リセット'}
                      </button>
                      <button onClick={() => { setResetTarget(null); setNewPassword('') }} className="text-xs px-2" style={{ color: 'var(--text-3)' }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setResetTarget(auth.cast_id)}
                            className="flex items-center gap-1 text-xs transition-colors" style={{ color: 'var(--text-3)' }}>
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
