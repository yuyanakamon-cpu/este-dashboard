'use client'

import { useState } from 'react'
import { CASTS, PLATFORM_LABELS } from '@/lib/mock-data'
import type { Platform } from '@/lib/types'
import type { CastAuth } from '@/lib/auth/cast-auth'
import { TrendingUp, Users, FileText, CalendarCheck, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import clsx from 'clsx'
import CastCredentials from '@/components/cast-login/CastCredentials'

const PLATFORMS: Platform[] = ['x', 'bluesky', 'threads', 'instagram']

const PLATFORM_ICONS: Record<Platform, string> = {
  x: '𝕏',
  bluesky: '🦋',
  threads: '🧵',
  instagram: '📷',
}

const COLORS = [
  'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700',
  'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700',
  'bg-green-100 text-green-700', 'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700', 'bg-indigo-100 text-indigo-700',
]

export default function MasterDashboard() {
  const [authCasts, setAuthCasts] = useState<CastAuth[]>([])

  // KPI（モックデータ）
  const totalFollowers = CASTS.reduce((sum, c) =>
    sum + Object.values(c.platforms).reduce((s, p) => s + (p.connected ? p.followers : 0), 0), 0)
  const totalPostsToday = CASTS.reduce((sum, c) =>
    sum + Object.values(c.platforms).reduce((s, p) => s + p.posts_today, 0), 0)
  const onShiftCount = CASTS.filter(c => c.status === 'on_shift').length
  const totalBookings = CASTS.reduce((sum, c) => sum + c.monthly_bookings_estimated, 0)
  const totalScheduled = CASTS.reduce((sum, c) =>
    sum + c.posts.filter(p => p.status === 'scheduled').length, 0)

  const now = new Date()
  const dateStr = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div className="p-8 animate-fade-in">
      {/* ヘッダー */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">マスター管理画面</h1>
          <p className="text-sm text-stone-400 mt-1">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-medium border border-green-100">
            <span className="status-dot status-on_shift" />
            システム稼働中
          </span>
        </div>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <KpiCard
          icon={<Users size={16} className="text-rose-500" />}
          label="在籍キャスト"
          value={`${CASTS.length}名`}
          sub={`出勤中 ${onShiftCount}名`}
          color="rose"
        />
        <KpiCard
          icon={<FileText size={16} className="text-sky-500" />}
          label="本日の投稿数"
          value={`${totalPostsToday}件`}
          sub="全媒体合計"
          color="sky"
        />
        <KpiCard
          icon={<Clock size={16} className="text-amber-500" />}
          label="投稿予定（残）"
          value={`${totalScheduled}件`}
          sub="今日のスケジュール"
          color="amber"
        />
        <KpiCard
          icon={<TrendingUp size={16} className="text-purple-500" />}
          label="総フォロワー"
          value={totalFollowers.toLocaleString()}
          sub="全媒体 全キャスト"
          color="purple"
        />
        <KpiCard
          icon={<CalendarCheck size={16} className="text-green-500" />}
          label="月間予約（推計）"
          value={`${totalBookings}件`}
          sub="SNS経由"
          color="green"
        />
      </div>

      {/* キャスト一覧（auth storeベース）*/}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wider">キャスト一覧</h2>
          <span className="text-xs text-stone-400">{authCasts.length}名</span>
        </div>

        {authCasts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 p-8 text-center">
            <div className="text-3xl mb-2">🌸</div>
            <p className="text-sm text-stone-400">まだキャストが登録されていません</p>
            <p className="text-xs text-stone-300 mt-1">下の「ID発行」からキャストを追加してください</p>
          </div>
        ) : (
          <div className="space-y-3">
            {authCasts.map((auth, i) => (
              <div key={auth.cast_id}
                className="bg-white rounded-2xl border border-stone-100 p-5"
                style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center gap-4">
                  <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0', COLORS[i % COLORS.length])}>
                    {auth.display_name ? auth.display_name.charAt(0) : auth.login_id.slice(-2)}
                  </div>
                  <div className="w-48 shrink-0">
                    <div className="font-semibold text-stone-800 text-sm">
                      {auth.display_name || `No.${auth.login_id}`}
                    </div>
                    <div className="text-xs text-stone-400">ID: {auth.login_id}</div>
                  </div>
                  <div className="w-28 shrink-0">
                    {auth.is_setup_complete
                      ? <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium bg-green-50 text-green-700 border-green-100">
                          <CheckCircle2 size={10} />ログイン済み
                        </span>
                      : <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium bg-amber-50 text-amber-700 border-amber-100">
                          PW未設定
                        </span>
                    }
                  </div>
                  <div className="flex-1 flex gap-2 flex-wrap">
                    {PLATFORMS.map(p => {
                      const sns = auth.sns_status?.[p]
                      return (
                        <div key={p} className="text-center">
                          <div className="text-[10px] text-stone-400 mb-0.5">{PLATFORM_ICONS[p]}</div>
                          {sns?.connected
                            ? <div className="text-[11px] text-stone-600 font-medium">@{sns.username || '接続済'}</div>
                            : <div className="text-[11px] text-stone-300">——</div>
                          }
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-right shrink-0">
                    {auth.last_login_at
                      ? <div className="text-xs text-stone-400">{new Date(auth.last_login_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                      : <div className="text-xs text-stone-300">未ログイン</div>
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* プラットフォーム別集計 */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wider mb-4">プラットフォーム別 集計</h2>
        <div className="grid grid-cols-4 gap-4">
          {PLATFORMS.map(platform => {
            const connected = CASTS.filter(c => c.platforms[platform].connected).length
            const totalF = CASTS.reduce((s, c) => s + (c.platforms[platform].connected ? c.platforms[platform].followers : 0), 0)
            const totalPosts = CASTS.reduce((s, c) => s + c.platforms[platform].posts_today, 0)
            const avgEng = connected > 0
              ? CASTS.filter(c => c.platforms[platform].connected)
                  .reduce((s, c) => s + c.platforms[platform].engagement_rate, 0) / connected
              : 0

            return (
              <div key={platform} className="bg-white rounded-2xl border border-stone-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg">{PLATFORM_ICONS[platform]}</span>
                  <span className="text-xs text-stone-400">{connected}/{CASTS.length}名 接続中</span>
                </div>
                <div className="text-xs font-medium text-stone-500 mb-3">{PLATFORM_LABELS[platform]}</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-stone-400">総フォロワー</span>
                    <span className="text-xs font-semibold text-stone-700">{totalF.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-stone-400">本日の投稿</span>
                    <span className="text-xs font-semibold text-stone-700">{totalPosts}件</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-stone-400">平均ENG率</span>
                    <span className="text-xs font-semibold text-stone-700">{avgEng.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-1">
                  {CASTS.map(cast => (
                    <div key={cast.id}
                      title={cast.name}
                      className={clsx('h-1.5 flex-1 rounded-full', cast.platforms[platform].connected ? 'bg-rose-400' : 'bg-stone-100')}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 本日のスケジュール（全キャスト） */}
      <div className="mt-8 mb-4">
        <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wider mb-4">本日の投稿スケジュール（全キャスト）</h2>
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="grid grid-cols-5 text-[10px] font-medium text-stone-400 uppercase tracking-wider px-5 py-3 border-b border-stone-50 bg-stone-50">
            <div>時刻</div>
            <div>キャスト</div>
            <div>種別</div>
            <div>媒体</div>
            <div>ステータス</div>
          </div>
          <div className="divide-y divide-stone-50">
            {CASTS.flatMap(cast =>
              cast.posts.map(post => ({ ...post, castName: cast.name, castColor: cast.avatar_color, castInitial: cast.avatar_initial }))
            )
              .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
              .slice(0, 12)
              .map(post => (
                <div key={post.id} className="grid grid-cols-5 px-5 py-3 items-center hover:bg-stone-50 transition-colors">
                  <div className="text-xs font-mono text-stone-500">
                    {new Date(post.scheduled_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold', post.castColor)}>
                      {post.castInitial}
                    </div>
                    <span className="text-xs text-stone-700">{post.castName}</span>
                  </div>
                  <div><TypeBadge type={post.type} /></div>
                  <div className="flex gap-1 flex-wrap">
                    {post.platforms.map(p => (
                      <span key={p} className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
                        {PLATFORM_ICONS[p as Platform]}
                      </span>
                    ))}
                  </div>
                  <div><PostStatusBadge status={post.status} /></div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* キャスト ログイン情報管理 */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wider mb-4">キャスト ログイン情報管理</h2>
        <CastCredentials onUpdate={setAuthCasts} />
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-stone-400 font-medium">{label}</span>
        {icon}
      </div>
      <div className="text-xl font-semibold text-stone-800">{value}</div>
      <div className="text-xs text-stone-400 mt-0.5">{sub}</div>
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    shift_announce: 'bg-rose-50 text-rose-600',
    vacancy: 'bg-amber-50 text-amber-600',
    personality: 'bg-purple-50 text-purple-600',
    media: 'bg-sky-50 text-sky-600',
  }
  const labels: Record<string, string> = {
    shift_announce: '出勤告知',
    vacancy: '空き情報',
    personality: '人柄',
    media: 'メディア',
  }
  return (
    <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium', map[type])}>
      {labels[type]}
    </span>
  )
}

function PostStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    posted: { label: '投稿済', icon: <CheckCircle2 size={10} />, cls: 'text-green-600' },
    scheduled: { label: '予定', icon: <Clock size={10} />, cls: 'text-sky-600' },
    draft: { label: '下書き', icon: <FileText size={10} />, cls: 'text-stone-500' },
    failed: { label: '失敗', icon: <AlertCircle size={10} />, cls: 'text-red-500' },
  }
  const { label, icon, cls } = map[status] || map['draft']
  return (
    <span className={clsx('inline-flex items-center gap-1 text-[10px] font-medium', cls)}>
      {icon}{label}
    </span>
  )
}
