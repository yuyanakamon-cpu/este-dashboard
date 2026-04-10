'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Link2Off, ChevronRight, Info } from 'lucide-react'

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

const SNS_CONFIG = [
  {
    key: 'x',
    name: 'X (Twitter)',
    icon: '𝕏',
    color: 'bg-zinc-900',
    textColor: 'text-white',
    borderColor: 'border-zinc-800',
    priority: 1,
    description: '最優先・最重要。出勤告知・空き情報の主戦場',
    placeholder: '@ユーザー名',
    guide: 'Xの「設定」→「セキュリティとアカウントアクセス」→「アプリとセッション」で連携',
  },
  {
    key: 'bluesky',
    name: 'Bluesky',
    icon: '🦋',
    color: 'bg-sky-500',
    textColor: 'text-white',
    borderColor: 'border-sky-400',
    priority: 2,
    description: 'X凍結時のバックアップ。先行者メリット大',
    placeholder: 'handle.bsky.social',
    guide: 'Blueskyの「設定」→「アプリパスワード」から連携',
  },
  {
    key: 'threads',
    name: 'Threads',
    icon: '🧵',
    color: 'bg-zinc-800',
    textColor: 'text-white',
    borderColor: 'border-zinc-700',
    priority: 3,
    description: 'Instagram連携で自動リーチ。日常投稿向き',
    placeholder: '@ユーザー名',
    guide: 'Instagramアプリ内の「Threads」から連携',
  },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-r from-purple-500 to-rose-500',
    textColor: 'text-white',
    borderColor: 'border-purple-400',
    priority: 4,
    description: '写真・Reelsで集客。週3〜4投稿が最適',
    placeholder: '@ユーザー名',
    guide: '「設定」→「アカウント」→「APIアクセス」から連携',
  },
]

export default function SnsConnectionPage() {
  const router = useRouter()
  const [auth, setAuth] = useState<AuthData | null>(null)
  const [snsStatus, setSnsStatus] = useState<Record<string, SnsStatus>>({})
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null)
  const [usernameInput, setUsernameInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedPlatform, setSavedPlatform] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  // 名前編集
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
    setUsernameInput(snsStatus[platform]?.username ?? '')
  }

  // 名前を保存
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
    if (!auth || !usernameInput.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/cast-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_sns',
          cast_id: auth.cast_id,
          platform,
          connected: true,
          username: usernameInput.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        const newStatus = {
          ...snsStatus,
          [platform]: { connected: true, username: usernameInput.trim(), connected_at: new Date().toISOString() },
        }
        setSnsStatus(newStatus)
        sessionStorage.setItem('cast_auth', JSON.stringify({ ...auth, sns_status: newStatus }))
        setEditingPlatform(null)
        setSavedPlatform(platform)
        setTimeout(() => setSavedPlatform(null), 2000)
      } else {
        setSaveError(data.error ?? '保存に失敗しました')
      }
    } catch {
      setSaveError('通信エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async (platform: string) => {
    if (!auth) return
    await fetch('/api/cast-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_sns', cast_id: auth.cast_id, platform, connected: false, username: '' }),
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
    <div className="min-h-screen bg-rose-50 flex items-center justify-center">
      <div className="text-stone-400 text-sm">読み込み中...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* ヘッダー */}
      <div className="bg-white border-b border-stone-100 px-5 pt-12 pb-5">
        <p className="text-xs text-stone-400 mb-1">ようこそ</p>

        {/* 名前表示 + 編集 */}
        {editingName ? (
          <div className="space-y-2 mb-2">
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="例: 〇〇エステ さくら"
              autoFocus
              className="w-full border border-rose-300 rounded-xl px-3 py-2.5 text-base text-stone-800 focus:outline-none"
              style={{ fontSize: '16px' }}
            />
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
              <p className="text-xs text-stone-500 leading-relaxed">
                ・1店舗 → <span className="font-medium text-stone-700">〇〇エステ さくら</span><br />
                ・2店舗 → <span className="font-medium text-stone-700">〇〇エステ さくら、△△エステ みお</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveName} disabled={!nameInput.trim() || savingName}
                className="flex-1 bg-rose-500 text-white text-sm py-2.5 rounded-xl font-medium disabled:opacity-40">
                {savingName ? '保存中...' : '保存する'}
              </button>
              <button onClick={() => setEditingName(false)} className="text-sm text-stone-400 px-4">キャンセル</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-semibold text-stone-800">
              {auth.display_name || auth.cast_name}さん
            </h1>
            <button
              onClick={() => { setNameInput(auth.display_name || auth.cast_name || ''); setEditingName(true) }}
              className="text-xs text-rose-500 border border-rose-200 px-2.5 py-1 rounded-lg"
            >
              名前を変更
            </button>
          </div>
        )}
        {!editingName && auth.display_name && (
          <p className="text-xs text-stone-400 mb-1">{auth.display_name}</p>
        )}
        <p className="text-sm text-stone-500 mt-1">SNSアカウントを連携してください</p>

        {/* 進捗バー */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-stone-400 mb-1.5">
            <span>連携済み</span>
            <span>{connectedCount} / 4</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-400 rounded-full transition-all duration-500"
              style={{ width: `${(connectedCount / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* SNSリスト */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">

        {/* APIキー未設定の注意書き */}
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
          <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            現在は連携情報の登録のみできます。実際の自動投稿はオーナーがAPIを設定した後に有効になります。
          </p>
        </div>

        {SNS_CONFIG.map(sns => {
          const status = snsStatus[sns.key]
          const isConnected = status?.connected
          const isEditing = editingPlatform === sns.key
          const justSaved = savedPlatform === sns.key

          return (
            <div key={sns.key} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
              {/* SNSヘッダー */}
              <div className="flex items-center gap-3 p-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${sns.color} ${sns.textColor} shrink-0`}>
                  {sns.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-800 text-sm">{sns.name}</span>
                    <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">優先度 {sns.priority}</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5 truncate">{sns.description}</p>
                </div>

                {/* 接続ボタン or チェック */}
                {isConnected ? (
                  <button
                    onClick={() => setEditingPlatform(isEditing ? null : sns.key)}
                    className="shrink-0 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100"
                  >
                    <CheckCircle2 size={12} />
                    {justSaved ? '保存済！' : '接続中'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(sns.key)}
                    className="shrink-0 flex items-center gap-1 text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100"
                  >
                    連携する
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>

              {/* 接続済みのユーザー名表示 */}
              {isConnected && !isEditing && (
                <div className="px-4 pb-3 flex items-center justify-between">
                  <span className="text-xs text-stone-500">@{status.username}</span>
                  <button
                    onClick={() => handleConnect(sns.key)}
                    className="text-xs text-stone-400 underline"
                  >
                    編集
                  </button>
                </div>
              )}

              {/* 入力フォーム（展開時） */}
              {isEditing && (
                <div className="px-4 pb-4 border-t border-stone-50 pt-3">
                  <p className="text-xs text-stone-500 mb-2">{sns.guide}</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={e => setUsernameInput(e.target.value)}
                      placeholder={sns.placeholder}
                      autoCapitalize="none"
                      className="flex-1 text-sm border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-rose-400 transition-colors"
                      style={{ fontSize: '16px' }}
                    />
                    <button
                      onClick={() => handleSave(sns.key)}
                      disabled={!usernameInput.trim() || saving}
                      className="bg-rose-500 text-white text-xs px-4 py-2.5 rounded-xl font-medium disabled:opacity-40"
                    >
                      {saving ? '保存中' : '保存'}
                    </button>
                  </div>
                  {saveError && isEditing && (
                    <p className="text-xs text-red-500 mt-2 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>
                  )}
                  {isConnected && (
                    <button
                      onClick={() => handleDisconnect(sns.key)}
                      className="flex items-center gap-1 text-xs text-red-400 mt-2"
                    >
                      <Link2Off size={11} />連携を解除
                    </button>
                  )}
                  <button onClick={() => setEditingPlatform(null)} className="text-xs text-stone-400 mt-2 ml-3">キャンセル</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 底部ボタン */}
      <div className="px-4 pb-8 pt-4 bg-stone-50 border-t border-stone-100">
        <button
          onClick={handleDone}
          className="w-full bg-rose-500 text-white text-base font-medium py-4 rounded-2xl hover:bg-rose-600 active:scale-[0.98] transition-all"
        >
          {connectedCount > 0 ? `${connectedCount}件連携済み — ダッシュボードへ` : 'あとで設定する'}
        </button>
        <p className="text-center text-xs text-stone-400 mt-3">連携はあとからでも変更できます</p>
      </div>
    </div>
  )
}
