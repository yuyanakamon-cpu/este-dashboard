'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Link2Off, ChevronRight, Info, Eye, EyeOff } from 'lucide-react'

interface SnsStatus {
  connected: boolean
  username: string
  connected_at: string | null
}

interface AuthData {
  cast_id: string
  cast_name: string
  display_name?: string
  sns_status: Record<string, SnsStatus>
}

// ─── 各プラットフォームのフィールド定義 ───
const SNS_CONFIG = [
  {
    key: 'bluesky',
    name: 'Bluesky',
    icon: '🦋',
    color: 'bg-sky-500',
    textColor: 'text-white',
    priority: 1,
    description: 'X凍結時のバックアップ。先行者メリット大',
    howTo: 'Bluesky → 設定 → アプリパスワード → 新しいアプリパスワードを作成',
    fields: [
      { key: 'identifier', label: 'ハンドル名', placeholder: 'yourname.bsky.social', secret: false },
      { key: 'appPassword', label: 'アプリパスワード', placeholder: 'xxxx-xxxx-xxxx-xxxx', secret: true },
    ],
    usernameField: 'identifier',
  },
  {
    key: 'x',
    name: 'X (Twitter)',
    icon: '𝕏',
    color: 'bg-zinc-900',
    textColor: 'text-white',
    priority: 2,
    description: '出勤告知・空き情報の主戦場',
    howTo: 'X Developer Portal → プロジェクト → Keys and Tokens → Access Token & Secret (Read and Write権限)',
    fields: [
      { key: 'appKey',      label: 'API Key',          placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxx', secret: false },
      { key: 'appSecret',   label: 'API Key Secret',   placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', secret: true },
      { key: 'accessToken', label: 'Access Token',     placeholder: 'xxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', secret: false },
      { key: 'accessSecret',label: 'Access Token Secret', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', secret: true },
    ],
    usernameField: 'accessToken',
  },
  {
    key: 'threads',
    name: 'Threads',
    icon: '🧵',
    color: 'bg-zinc-800',
    textColor: 'text-white',
    priority: 3,
    description: 'Instagram連携で自動リーチ。日常投稿向き',
    howTo: 'Meta for Developers → Threads API → アクセストークン発行 → ユーザーIDはThreadsプロフィールURLから取得',
    fields: [
      { key: 'accessToken',   label: 'アクセストークン', placeholder: 'EAAxxxxxxxxxxxx...', secret: true },
      { key: 'threadsUserId', label: 'Threads User ID', placeholder: '123456789012345', secret: false },
    ],
    usernameField: 'threadsUserId',
  },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-r from-burgundy to-gold',
    textColor: 'text-white',
    priority: 4,
    description: '写真・Reelsで集客。週3〜4投稿が最適',
    howTo: 'Meta for Developers → Instagram Graph API → 長期アクセストークン取得 → IG User IDはビジネスアカウントID',
    fields: [
      { key: 'accessToken', label: '長期アクセストークン', placeholder: 'EAAxxxxxxxxxxxx...', secret: true },
      { key: 'igUserId',    label: 'Instagram User ID', placeholder: '123456789012345', secret: false },
    ],
    usernameField: 'igUserId',
  },
]

export default function SnsConnectionPage() {
  const router = useRouter()
  const [auth, setAuth] = useState<AuthData | null>(null)
  const [snsStatus, setSnsStatus] = useState<Record<string, SnsStatus>>({})
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [savedPlatform, setSavedPlatform] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('cast_auth')
    if (!stored) { router.push('/cast-login'); return }
    const data = JSON.parse(stored) as AuthData
    setAuth(data)
    setSnsStatus(data.sns_status ?? {})
  }, [router])

  const connectedCount = Object.values(snsStatus).filter(s => s?.connected).length

  const handleConnect = (platform: string) => {
    setEditingPlatform(platform)
    setFieldValues({})
    setShowSecret({})
    setSaveError(null)
  }

  const handleSaveName = async () => {
    if (!auth || !nameInput.trim()) return
    setSavingName(true)
    try {
      await fetch('/api/cast-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_display_name', cast_id: auth.cast_id, display_name: nameInput.trim() }),
      })
      const updated = { ...auth, display_name: nameInput.trim() }
      setAuth(updated)
      sessionStorage.setItem('cast_auth', JSON.stringify(updated))
      setEditingName(false)
    } finally { setSavingName(false) }
  }

  const handleSave = async (platform: string) => {
    if (!auth) return
    const config = SNS_CONFIG.find(s => s.key === platform)
    if (!config) return

    // バリデーション
    const missing = config.fields.filter(f => !fieldValues[f.key]?.trim())
    if (missing.length > 0) {
      setSaveError(`未入力: ${missing.map(f => f.label).join('、')}`)
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      const credentials: Record<string, string> = {}
      config.fields.forEach(f => { credentials[f.key] = fieldValues[f.key].trim() })

      // 認証情報をSupabaseに保存
      const res = await fetch('/api/cast-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_sns_credentials',
          cast_id: auth.cast_id,
          platform,
          credentials,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setSaveError(data.error ?? '保存に失敗しました')
        return
      }

      const usernameValue = credentials[config.usernameField] ?? ''
      const newStatus: SnsStatus = {
        connected: true,
        username: usernameValue,
        connected_at: new Date().toISOString(),
      }
      const updatedStatus = { ...snsStatus, [platform]: newStatus }
      setSnsStatus(updatedStatus)
      sessionStorage.setItem('cast_auth', JSON.stringify({ ...auth, sns_status: updatedStatus }))
      setEditingPlatform(null)
      setFieldValues({})
      setSavedPlatform(platform)
      setTimeout(() => setSavedPlatform(null), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async (platform: string) => {
    if (!auth) return
    await fetch('/api/cast-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_sns_credentials',
        cast_id: auth.cast_id,
        platform,
        credentials: null,
      }),
    })
    const newStatus = { ...snsStatus, [platform]: { connected: false, username: '', connected_at: null } }
    setSnsStatus(newStatus)
    sessionStorage.setItem('cast_auth', JSON.stringify({ ...auth, sns_status: newStatus }))
    setEditingPlatform(null)
  }

  const handleDone = () => {
    if (auth) router.push(`/cast/${auth.cast_id}`)
  }

  if (!auth) return (
    <div className="min-h-screen bg-gold-bg flex items-center justify-center">
      <div className="text-ink-3 text-sm">読み込み中...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-bg-muted flex flex-col">
      {/* ヘッダー */}
      <div className="bg-white border-b border-edge px-5 pt-12 pb-5">
        <p className="text-xs text-ink-3 mb-1">SNS連携</p>

        {editingName ? (
          <div className="space-y-2 mb-2">
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="例: さくら"
              autoFocus
              className="w-full border border-burgundy rounded-xl px-3 py-2.5 text-base text-ink-1 focus:outline-none"
              style={{ fontSize: '16px' }}
            />
            <div className="flex gap-2">
              <button onClick={handleSaveName} disabled={!nameInput.trim() || savingName}
                className="flex-1 bg-burgundy text-white text-sm py-2.5 rounded-xl font-medium disabled:opacity-40">
                {savingName ? '保存中...' : '保存する'}
              </button>
              <button onClick={() => setEditingName(false)} className="text-sm text-ink-3 px-4">キャンセル</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-semibold text-ink-1">
              {auth.display_name || auth.cast_name}さん
            </h1>
            <button
              onClick={() => { setNameInput(auth.display_name || auth.cast_name || ''); setEditingName(true) }}
              className="text-xs text-burgundy border border-edge-gold px-2.5 py-1 rounded-lg"
            >
              名前変更
            </button>
          </div>
        )}

        <p className="text-sm text-ink-3 mt-1">SNSのAPIキーを入力して連携してください</p>

        {/* 進捗バー */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-ink-3 mb-1.5">
            <span>連携済み</span>
            <span>{connectedCount} / 4</span>
          </div>
          <div className="h-2 bg-bg-soft rounded-full overflow-hidden">
            <div
              className="h-full bg-burgundy rounded-full transition-all duration-500"
              style={{ width: `${(connectedCount / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* SNSリスト */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">

        {/* 説明 */}
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
          <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            APIキーはSupabaseに暗号化保存されます。自動投稿に使用し、閲覧は管理者のみ可能です。
            取得方法は各SNSの「連携する」ボタンを押すと表示されます。
          </p>
        </div>

        {SNS_CONFIG.map(sns => {
          const status = snsStatus[sns.key]
          const isConnected = status?.connected
          const isEditing = editingPlatform === sns.key
          const justSaved = savedPlatform === sns.key

          return (
            <div key={sns.key} className="bg-white rounded-2xl border border-edge overflow-hidden">
              {/* SNSヘッダー */}
              <div className="flex items-center gap-3 p-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${sns.color} ${sns.textColor} shrink-0`}>
                  {sns.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink-1 text-sm">{sns.name}</span>
                    <span className="text-[10px] bg-bg-soft text-ink-3 px-1.5 py-0.5 rounded">優先 {sns.priority}</span>
                  </div>
                  <p className="text-xs text-ink-3 mt-0.5 truncate">{sns.description}</p>
                </div>

                {isConnected ? (
                  <button
                    onClick={() => setEditingPlatform(isEditing ? null : sns.key)}
                    className="shrink-0 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100"
                  >
                    <CheckCircle2 size={12} />
                    {justSaved ? '保存済！' : '連携中'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(sns.key)}
                    className="shrink-0 flex items-center gap-1 text-xs text-burgundy bg-gold-bg px-3 py-1.5 rounded-xl border border-edge-gold"
                  >
                    連携する
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>

              {/* 接続済みの情報表示 */}
              {isConnected && !isEditing && (
                <div className="px-4 pb-3 flex items-center justify-between">
                  <span className="text-xs text-ink-3 font-mono truncate">{status.username}</span>
                  <button
                    onClick={() => handleConnect(sns.key)}
                    className="text-xs text-ink-3 underline ml-3 shrink-0"
                  >
                    更新
                  </button>
                </div>
              )}

              {/* 入力フォーム（展開時） */}
              {isEditing && (
                <div className="px-4 pb-4 border-t border-edge pt-3 space-y-3">
                  {/* 取得方法 */}
                  <div className="bg-bg-muted rounded-xl p-3 border border-edge">
                    <p className="text-[11px] text-ink-3 leading-relaxed">
                      <span className="font-semibold text-ink-1">取得方法：</span>{sns.howTo}
                    </p>
                  </div>

                  {/* 各フィールド */}
                  {sns.fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-xs text-ink-3 mb-1 font-medium">{field.label}</label>
                      <div className="relative">
                        <input
                          type={field.secret && !showSecret[field.key] ? 'password' : 'text'}
                          value={fieldValues[field.key] ?? ''}
                          onChange={e => setFieldValues(v => ({ ...v, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          autoCapitalize="none"
                          autoComplete="off"
                          className="w-full text-xs border border-edge-soft rounded-xl px-3 py-2.5 pr-9 focus:outline-none focus:border-burgundy transition-colors font-mono"
                          style={{ fontSize: '14px' }}
                        />
                        {field.secret && (
                          <button
                            type="button"
                            onClick={() => setShowSecret(v => ({ ...v, [field.key]: !v[field.key] }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2"
                          >
                            {showSecret[field.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {saveError && (
                    <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleSave(sns.key)}
                      disabled={saving}
                      className="flex-1 bg-burgundy text-white text-sm py-2.5 rounded-xl font-medium disabled:opacity-40"
                    >
                      {saving ? '保存中...' : '保存して連携'}
                    </button>
                    <button
                      onClick={() => { setEditingPlatform(null); setSaveError(null) }}
                      className="text-sm text-ink-3 px-4"
                    >
                      キャンセル
                    </button>
                  </div>

                  {isConnected && (
                    <button
                      onClick={() => handleDisconnect(sns.key)}
                      className="flex items-center gap-1 text-xs text-red-400"
                    >
                      <Link2Off size={11} />連携を解除
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 底部ボタン */}
      <div className="px-4 pb-8 pt-4 bg-bg-muted border-t border-edge">
        <button
          onClick={handleDone}
          className="w-full bg-burgundy text-white text-base font-medium py-4 rounded-2xl hover:bg-burgundy-dark active:scale-[0.98] transition-all"
        >
          {connectedCount > 0 ? `${connectedCount}件連携済み — ダッシュボードへ` : 'あとで設定する'}
        </button>
        <p className="text-center text-xs text-ink-3 mt-3">連携はあとからでも変更できます</p>
      </div>
    </div>
  )
}
