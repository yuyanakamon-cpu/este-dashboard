'use client'

import { useState } from 'react'
import { CASTS, PLATFORM_LABELS } from '@/lib/mock-data'
import type { Platform } from '@/lib/types'
import type { CastAuth } from '@/lib/auth/cast-auth'
import { TrendingUp, Users, FileText, CalendarCheck, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import clsx from 'clsx'
import CastCredentials from '@/components/cast-login/CastCredentials'

const PLATFORMS: Platform[] = ['x', 'bluesky', 'threads', 'instagram']

// プラットフォームを SVG アイコンで（emoji撤廃）
const PlatformIcon = ({ p, size = 14 }: { p: Platform; size?: number }) => {
  const icons: Record<Platform, JSX.Element> = {
    x: (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21l-6.55 7.486L22 22h-6.273l-4.92-6.41L5.13 22H2.37l7.011-8.014L2 2h6.4l4.46 5.864L18.244 2zm-1.1 18h1.706L7.05 4H5.244l11.9 16z"/></svg>),
    bluesky: (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M5.99 4.49C8.79 6.59 11.81 10.85 12 12.16c.19-1.31 3.21-5.57 6.01-7.67 2.02-1.51 5.29-2.68 5.29.97 0 .73-.42 6.13-.66 7.01-.85 3.05-3.97 3.83-6.74 3.36 4.85.83 6.08 3.55 3.41 6.27-5.07 5.16-7.27-1.3-7.84-2.96l-.05-.16c-.27-.81-.57-.81-.84 0l-.05.16C9.96 20.8 7.76 27.26 2.69 22.1.02 19.38 1.25 16.66 6.1 15.83c-2.77.47-5.89-.31-6.74-3.36C-.88 11.59-1.3 6.19-1.3 5.46c0-3.65 3.27-2.48 5.29-.97z"/></svg>),
    threads: (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291.815-.046 1.78-.046 2.736.156-.064-1.46-.31-2.45-.94-3.075-.703-.696-1.804-.956-3.176-.956h-.038c-1.117 0-2.633.157-3.586 1.586l-1.696-1.143c1.38-2.072 3.45-2.503 5.282-2.503h.039c2.116.014 3.798.74 4.998 2.156.973 1.144 1.5 2.704 1.624 4.821.84.358 1.486.852 1.965 1.383 1.097 1.218 1.624 3.078 1.158 4.857-.706 2.694-3.034 4.418-6.287 4.45zm-1.1-12.97c-.314.022-.625.061-.93.117-.85.155-1.512.444-1.978.864-.466.42-.722.946-.687 1.61.043.825.514 1.347 1.225 1.628.626.247 1.39.31 2.16.18.882-.149 1.505-.508 1.892-1.108.401-.62.564-1.483.5-2.658-.694-.196-1.46-.293-2.183-.293-.07 0-.139.002-.207.006z"/></svg>),
    instagram: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>),
  }
  return icons[p]
}

export default function MasterDashboard() {
  const [authCasts, setAuthCasts] = useState<CastAuth[]>([])

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
    <div className="p-8 animate-fade-in" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <div className="text-[10px] tracking-[0.32em] uppercase font-semibold mb-2" style={{ color: 'var(--text-3)' }}>
            Master Dashboard
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-[0.04em]" style={{ color: 'var(--burgundy)' }}>
            管理画面
          </h1>
          <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>{dateStr}</p>
        </div>
        <span className="pd-badge pd-badge-emerald">
          <span className="pd-status-dot pd-status-on mr-2" />
          システム稼働中
        </span>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        <KpiCard icon={<Users size={14} />} label="在籍キャスト" value={`${CASTS.length}`} suffix="名" sub={`出勤中 ${onShiftCount}名`} />
        <KpiCard icon={<FileText size={14} />} label="本日の投稿数" value={`${totalPostsToday}`} suffix="件" sub="全媒体合計" />
        <KpiCard icon={<Clock size={14} />} label="投稿予定（残）" value={`${totalScheduled}`} suffix="件" sub="今日のスケジュール" />
        <KpiCard icon={<TrendingUp size={14} />} label="総フォロワー" value={totalFollowers.toLocaleString()} sub="全媒体 全キャスト" />
        <KpiCard icon={<CalendarCheck size={14} />} label="月間予約（推計）" value={`${totalBookings}`} suffix="件" sub="SNS経由" />
      </div>

      {/* キャスト一覧（auth storeベース）*/}
      <div className="mb-10">
        <div className="flex items-end justify-between mb-4">
          <h2 className="pd-section-title mb-0">キャスト一覧</h2>
          <span className="text-xs font-medium tracking-wider" style={{ color: 'var(--text-3)' }}>
            {authCasts.length} REGISTERED
          </span>
        </div>

        {authCasts.length === 0 ? (
          <div className="pd-card p-10 text-center">
            <div className="font-serif text-2xl mb-2" style={{ color: 'var(--burgundy)' }}>—</div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>まだキャストが登録されていません</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>下の「キャスト ログイン情報管理」からID発行してください</p>
          </div>
        ) : (
          <div className="space-y-3">
            {authCasts.map((auth, i) => (
              <div key={auth.cast_id} className="pd-card p-5 hover:shadow-pd transition-shadow" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-serif text-base font-semibold shrink-0"
                       style={{ background: 'linear-gradient(135deg, var(--gold-light), var(--gold))', color: 'var(--text-1)' }}>
                    {auth.display_name ? auth.display_name.charAt(0) : auth.login_id.slice(-2)}
                  </div>
                  <div className="w-48 shrink-0">
                    <div className="font-serif text-base font-semibold" style={{ color: 'var(--burgundy)' }}>
                      {auth.display_name || `No.${auth.login_id}`}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>ID: {auth.login_id}</div>
                  </div>
                  <div className="w-32 shrink-0">
                    {auth.is_setup_complete ? (
                      <span className="pd-badge pd-badge-emerald inline-flex items-center gap-1">
                        <CheckCircle2 size={10} />ログイン済み
                      </span>
                    ) : (
                      <span className="pd-badge pd-badge-amber">PW未設定</span>
                    )}
                  </div>
                  <div className="flex-1 flex gap-3 flex-wrap min-w-[200px]">
                    {PLATFORMS.map(p => {
                      const sns = auth.sns_status?.[p]
                      const connected = sns?.connected
                      return (
                        <div key={p} className="text-center min-w-[64px]">
                          <div className="mb-1 flex justify-center" style={{ color: connected ? 'var(--burgundy)' : 'var(--text-4)' }}>
                            <PlatformIcon p={p} size={14} />
                          </div>
                          {connected ? (
                            <div className="text-[11px] font-medium" style={{ color: 'var(--burgundy)' }}>@{sns?.username || '接続済'}</div>
                          ) : (
                            <div className="text-[11px]" style={{ color: 'var(--text-4)' }}>——</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-right shrink-0">
                    {auth.last_login_at ? (
                      <div className="text-xs" style={{ color: 'var(--text-3)' }}>
                        {new Date(auth.last_login_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ) : (
                      <div className="text-xs" style={{ color: 'var(--text-4)' }}>未ログイン</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* プラットフォーム別集計 */}
      <div className="mb-10">
        <h2 className="pd-section-title">プラットフォーム別 集計</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PLATFORMS.map(platform => {
            const connected = CASTS.filter(c => c.platforms[platform].connected).length
            const totalF = CASTS.reduce((s, c) => s + (c.platforms[platform].connected ? c.platforms[platform].followers : 0), 0)
            const totalPosts = CASTS.reduce((s, c) => s + c.platforms[platform].posts_today, 0)
            const avgEng = connected > 0
              ? CASTS.filter(c => c.platforms[platform].connected).reduce((s, c) => s + c.platforms[platform].engagement_rate, 0) / connected
              : 0

            return (
              <div key={platform} className="pd-card-feature p-5">
                <div className="flex items-center justify-between mb-3">
                  <span style={{ color: 'var(--burgundy)' }}><PlatformIcon p={platform} size={20} /></span>
                  <span className="text-[10px] tracking-wider font-medium" style={{ color: 'var(--text-3)' }}>{connected}/{CASTS.length}</span>
                </div>
                <div className="font-serif text-sm font-semibold mb-3" style={{ color: 'var(--burgundy)' }}>{PLATFORM_LABELS[platform]}</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] tracking-wider uppercase font-medium" style={{ color: 'var(--text-3)' }}>Followers</span>
                    <span className="font-serif text-base font-semibold" style={{ color: 'var(--text-1)' }}>{totalF.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] tracking-wider uppercase font-medium" style={{ color: 'var(--text-3)' }}>Posts</span>
                    <span className="font-serif text-base font-semibold" style={{ color: 'var(--text-1)' }}>{totalPosts}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] tracking-wider uppercase font-medium" style={{ color: 'var(--text-3)' }}>Eng. Rate</span>
                    <span className="font-serif text-base font-semibold" style={{ color: 'var(--gold-deep)' }}>{avgEng.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-1">
                  {CASTS.map(cast => (
                    <div key={cast.id} title={cast.name} className="h-1 flex-1 rounded-full"
                         style={{ background: cast.platforms[platform].connected ? 'var(--burgundy)' : 'var(--bg-soft)' }} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 本日のスケジュール */}
      <div className="mb-10">
        <h2 className="pd-section-title">本日の投稿スケジュール</h2>
        <div className="pd-card overflow-hidden">
          <div className="grid grid-cols-5 px-5 py-3 border-b text-[10px] font-semibold tracking-[0.16em] uppercase"
               style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)', color: 'var(--text-3)' }}>
            <div>時刻</div><div>キャスト</div><div>種別</div><div>媒体</div><div>ステータス</div>
          </div>
          <div>
            {CASTS.flatMap(cast => cast.posts.map(post => ({ ...post, castName: cast.name, castInitial: cast.avatar_initial })))
              .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
              .slice(0, 12)
              .map((post, i) => (
                <div key={post.id} className="grid grid-cols-5 px-5 py-3 items-center transition-colors hover:bg-bg-muted"
                     style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                  <div className="font-serif text-sm font-semibold" style={{ color: 'var(--burgundy)' }}>
                    {new Date(post.scheduled_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-serif font-semibold"
                         style={{ background: 'var(--gold-bg)', color: 'var(--gold-deep)', border: '1px solid var(--border-gold)' }}>
                      {post.castInitial}
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>{post.castName}</span>
                  </div>
                  <div><TypeBadge type={post.type} /></div>
                  <div className="flex gap-1.5">
                    {post.platforms.map(p => (
                      <span key={p} className="inline-flex items-center justify-center w-6 h-6 rounded-full"
                            style={{ background: 'var(--bg-soft)', color: 'var(--burgundy)' }}>
                        <PlatformIcon p={p as Platform} size={10} />
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
      <div>
        <h2 className="pd-section-title">キャスト ログイン情報管理</h2>
        <CastCredentials onUpdate={setAuthCasts} />
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, suffix, sub }: {
  icon: React.ReactNode; label: string; value: string; suffix?: string; sub: string
}) {
  return (
    <div className="pd-card-feature p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="pd-stat-label">{label}</span>
        <span style={{ color: 'var(--gold)' }}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="pd-stat-value">{value}</span>
        {suffix && <span className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>{suffix}</span>}
      </div>
      <div className="text-[11px] mt-2" style={{ color: 'var(--text-3)' }}>{sub}</div>
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    shift_announce: { label: '出勤告知', cls: 'pd-badge-burgundy' },
    vacancy:        { label: '空き情報', cls: 'pd-badge-amber' },
    personality:    { label: '人柄', cls: 'pd-badge-gold' },
    media:          { label: 'メディア', cls: 'pd-badge-emerald' },
  }
  const info = map[type] || { label: type, cls: 'pd-badge-muted' }
  return <span className={clsx('pd-badge', info.cls)}>{info.label}</span>
}

function PostStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    posted:    { label: '投稿済', icon: <CheckCircle2 size={10} />, color: 'var(--emerald)' },
    scheduled: { label: '予定',   icon: <Clock size={10} />,        color: 'var(--burgundy)' },
    draft:     { label: '下書き', icon: <FileText size={10} />,     color: 'var(--text-3)' },
    failed:    { label: '失敗',   icon: <AlertCircle size={10} />,  color: 'var(--rose-status)' },
  }
  const { label, icon, color } = map[status] || map['draft']
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wider" style={{ color }}>
      {icon}{label}
    </span>
  )
}
