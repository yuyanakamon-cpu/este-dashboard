'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { CheckCircle2, Settings, LogOut, Zap } from 'lucide-react'

interface SnsStatus {
  connected: boolean
  username: string
  connected_at: string | null
}

interface AuthData {
  cast_id: string
  display_name: string
  sns_status: Record<string, SnsStatus>
}

const SNS_CONFIG = [
  { key: 'x',         name: 'X',         icon: '𝕏' },
  { key: 'bluesky',   name: 'Bluesky',   icon: '🦋' },
  { key: 'threads',   name: 'Threads',   icon: '🧵' },
  { key: 'instagram', name: 'Instagram', icon: '📷' },
]

export default function CastDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const [auth, setAuth] = useState<AuthData | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('cast_auth')
    if (!stored) { router.push('/cast-login'); return }
    const data = JSON.parse(stored) as AuthData
    // IDが一致しない場合もログインページへ
    if (data.cast_id !== params.id) { router.push('/cast-login'); return }
    setAuth(data)
  }, [router, params.id])

  const handleLogout = () => {
    sessionStorage.removeItem('cast_auth')
    router.push('/cast-login')
  }

  if (!auth) return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center">
      <div className="text-stone-400 text-sm">読み込み中...</div>
    </div>
  )

  const connectedPlatforms = SNS_CONFIG.filter(s => auth.sns_status?.[s.key]?.connected)
  const unconnectedPlatforms = SNS_CONFIG.filter(s => !auth.sns_status?.[s.key]?.connected)

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* ヘッダー */}
      <div className="bg-white border-b border-stone-100 px-5 pt-12 pb-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-sm font-medium text-stone-500">ESTE SNS</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600">
            <LogOut size={13} />ログアウト
          </button>
        </div>
        <h1 className="text-xl font-semibold text-stone-800 mt-3">{auth.display_name}さん</h1>
        <p className="text-xs text-stone-400 mt-0.5">ID: {auth.cast_id}</p>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">

        {/* SNS接続状況 */}
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="text-sm font-semibold text-stone-700 mb-4">SNS接続状況</h2>
          <div className="space-y-3">
            {SNS_CONFIG.map(sns => {
              const status = auth.sns_status?.[sns.key]
              const isConnected = status?.connected
              return (
                <div key={sns.key} className="flex items-center gap-3">
                  <span className="text-xl w-7 text-center">{sns.icon}</span>
                  <div className="flex-1">
                    <span className="text-sm text-stone-700">{sns.name}</span>
                    {isConnected && status.username && (
                      <span className="text-xs text-stone-400 ml-2">@{status.username}</span>
                    )}
                  </div>
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100">
                      <CheckCircle2 size={11} />接続済
                    </span>
                  ) : (
                    <span className="text-xs text-stone-400 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-100">
                      未接続
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 未接続がある場合のCTA */}
        {unconnectedPlatforms.length > 0 && (
          <button
            onClick={() => router.push('/cast-login/sns')}
            className="w-full bg-rose-500 text-white text-sm font-medium py-3.5 rounded-2xl hover:bg-rose-600 active:scale-[0.98] transition-all"
          >
            SNSを追加で連携する ({unconnectedPlatforms.length}件未接続)
          </button>
        )}

        {/* 全接続済みの場合 */}
        {connectedPlatforms.length === 4 && (
          <div className="bg-green-50 rounded-2xl border border-green-100 p-4 text-center">
            <CheckCircle2 size={24} className="text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700">全SNS接続済みです</p>
            <p className="text-xs text-green-600 mt-0.5">自動投稿の準備が整っています</p>
          </div>
        )}

        {/* SNS設定変更 */}
        <button
          onClick={() => router.push('/cast-login/sns')}
          className="w-full flex items-center justify-center gap-2 text-sm text-stone-500 border border-stone-200 py-3 rounded-2xl hover:bg-stone-50"
        >
          <Settings size={14} />SNS設定を変更する
        </button>
      </div>
    </div>
  )
}
