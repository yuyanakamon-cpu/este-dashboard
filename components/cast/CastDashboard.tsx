'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { PLATFORM_LABELS, POST_TYPE_LABELS } from '@/lib/mock-data'
import PostsTab from '@/components/cast/PostsTab'
import type { Cast, Platform } from '@/lib/types'

const PLATFORMS: Platform[] = ['x', 'bluesky', 'threads', 'instagram']

const STATUS_LABEL: Record<string, string> = {
  on_shift: '出勤中',
  off_shift: '休み',
  break: '休憩中',
}
const STATUS_BADGE: Record<string, string> = {
  on_shift: 'pd-badge-emerald',
  off_shift: 'pd-badge-muted',
  break: 'pd-badge-amber',
}
const POST_TYPE_BADGE: Record<string, string> = {
  shift_announce: 'pd-badge-burgundy',
  vacancy: 'pd-badge-amber',
  personality: 'pd-badge-gold',
  media: 'pd-badge-emerald',
}

const TABS = [
  { key: 'overview', label: '概要' },
  { key: 'posts',    label: '投稿管理' },
  { key: 'char',     label: 'キャラ設定' },
  { key: 'analytics',label: '分析' },
]

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

export default function CastDashboard({
  cast,
  activeTab: activeTabProp,
  onTabChange,
}: {
  cast: Cast
  activeTab?: string
  onTabChange?: (tab: string) => void
}) {
  const [localTab, setLocalTab] = useState('overview')
  const activeTab = activeTabProp ?? localTab
  const setActiveTab = (tab: string) => {
    setLocalTab(tab)
    onTabChange?.(tab)
  }

  const totalFollowers = PLATFORMS.reduce((s, p) =>
    s + (cast.platforms[p].connected ? cast.platforms[p].followers : 0), 0)

  return (
    <div className="p-4 md:p-8 pb-20 md:pb-8 max-w-4xl mx-auto animate-fade-in" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 rounded-pd-lg flex items-center justify-center font-serif text-2xl font-semibold flex-shrink-0"
             style={{ background: 'linear-gradient(135deg, var(--gold-light), var(--gold))', color: 'var(--text-1)', border: '1px solid var(--border-gold)' }}>
          {cast.avatar_initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl font-semibold tracking-[0.02em]" style={{ color: 'var(--burgundy)' }}>{cast.display_name}</h1>
            <span className={clsx('pd-badge', STATUS_BADGE[cast.status])}>
              <span className={clsx('pd-status-dot mr-1.5 inline-block', `status-${cast.status}`)} />
              {STATUS_LABEL[cast.status]}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-sm" style={{ color: 'var(--text-3)' }}>
            <span>{cast.age}歳 · {cast.area}</span>
            <span>シフト {cast.shift_start}〜{cast.shift_end}</span>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {cast.personality_tags.map(tag => (
              <span key={tag} className="pd-badge pd-badge-muted">{tag}</span>
            ))}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="pd-stat-value">{totalFollowers.toLocaleString()}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold mt-1" style={{ color: 'var(--text-3)' }}>Followers</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-pd-lg w-fit max-w-full overflow-x-auto"
           style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-soft)' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="text-xs px-4 py-1.5 rounded-pd font-medium transition-all"
            style={{
              background: activeTab === tab.key ? 'var(--bg-card)' : 'transparent',
              color: activeTab === tab.key ? 'var(--burgundy)' : 'var(--text-3)',
              boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
              border: activeTab === tab.key ? '1px solid var(--border)' : '1px solid transparent',
              fontFamily: 'var(--f-serif)',
              fontSize: '13px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: 概要 */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-slide-up">
          <p className="text-sm leading-relaxed font-serif italic" style={{ color: 'var(--text-2)' }}>
            「{cast.character_desc}」
          </p>

          {/* Platform accounts */}
          <div>
            <h3 className="pd-section-title">SNS Accounts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLATFORMS.map(p => {
                const acc = cast.platforms[p]
                if (!acc.connected) return (
                  <div key={p} className="pd-card p-4" style={{ opacity: 0.45 }}>
                    <div className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: 'var(--text-3)' }}>{PLATFORM_LABELS[p]}</div>
                    <div className="text-xs" style={{ color: 'var(--text-4)' }}>未連携</div>
                  </div>
                )
                return (
                  <div key={p} className="pd-card-feature p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--burgundy)' }}>{PLATFORM_LABELS[p]}</span>
                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>@{acc.username}</span>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <div className="font-serif text-xl font-semibold" style={{ color: 'var(--burgundy)' }}>{acc.followers.toLocaleString()}</div>
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Followers</div>
                      </div>
                      <div className="text-right">
                        <div className="font-serif text-base font-semibold" style={{ color: 'var(--gold-deep)' }}>{acc.engagement_rate}%</div>
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Eng.</div>
                      </div>
                      <div className="text-right">
                        <div className="font-serif text-base font-semibold" style={{ color: 'var(--text-1)' }}>{acc.posts_today}</div>
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Today</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Monthly stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="pd-card p-4 text-center">
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-3)' }}>月間予測予約</div>
              <div className="font-serif text-2xl font-semibold" style={{ color: 'var(--burgundy)' }}>{cast.monthly_bookings_estimated}</div>
              <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: 'var(--text-3)' }}>件</div>
            </div>
            <div className="pd-card p-4 text-center">
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-3)' }}>フォロワー増加</div>
              <div className="font-serif text-2xl font-semibold" style={{ color: 'var(--emerald)' }}>+{cast.monthly_follower_growth.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: 'var(--text-3)' }}>人</div>
            </div>
            <div className="pd-card p-4 text-center">
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-3)' }}>月間投稿数</div>
              <div className="font-serif text-2xl font-semibold" style={{ color: 'var(--gold-deep)' }}>
                {PLATFORMS.reduce((s, p) => s + cast.platforms[p].posts_this_month, 0)}
              </div>
              <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: 'var(--text-3)' }}>件</div>
            </div>
          </div>

          {/* Posts timeline */}
          <div className="pd-card overflow-hidden">
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)' }}>
              <span className="font-serif text-base font-semibold" style={{ color: 'var(--burgundy)' }}>本日の投稿スケジュール</span>
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-3)' }}>{cast.posts.length} POSTS</span>
            </div>
            <div>
              {cast.posts
                .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
                .map((post, i) => (
                  <div key={post.id} className="px-5 py-4 flex items-start gap-3"
                       style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                    <div className="font-serif font-semibold w-14 flex-shrink-0" style={{ color: 'var(--burgundy)' }}>{formatTime(post.scheduled_at)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={clsx('pd-badge', POST_TYPE_BADGE[post.type] || 'pd-badge-muted')}>
                          {POST_TYPE_LABELS[post.type]}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-line line-clamp-2" style={{ color: 'var(--text-2)' }}>{post.content}</p>
                      {post.status === 'posted' && (post.likes !== undefined) && (
                        <div className="flex gap-3 mt-1.5 text-[11px]" style={{ color: 'var(--text-3)' }}>
                          <span>♥ {post.likes}</span>
                          <span>↺ {post.reposts}</span>
                          <span>💬 {post.replies}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: 投稿管理 */}
      {activeTab === 'posts' && <PostsTab cast={cast} />}

      {/* Tab: キャラ設定 */}
      {activeTab === 'char' && (
        <div className="pd-card p-6 animate-slide-up">
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>キャラ設定機能は実装予定です。</p>
        </div>
      )}

      {/* Tab: 分析 */}
      {activeTab === 'analytics' && (
        <div className="pd-card p-6 animate-slide-up">
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>分析機能は実装予定です。</p>
        </div>
      )}
    </div>
  )
}
