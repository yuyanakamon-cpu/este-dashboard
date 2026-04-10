'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { PLATFORM_LABELS, POST_TYPE_LABELS, POST_TYPE_COLORS } from '@/lib/mock-data'
import PostsTab from '@/components/cast/PostsTab'
import type { Cast, Platform } from '@/lib/types'

const PLATFORMS: Platform[] = ['x', 'bluesky', 'threads', 'instagram']

const STATUS_LABEL: Record<string, string> = {
  on_shift: '出勤中',
  off_shift: '休み',
  break: '休憩中',
}

const STATUS_STYLE: Record<string, string> = {
  on_shift: 'bg-green-50 text-green-700',
  off_shift: 'bg-stone-100 text-stone-500',
  break: 'bg-amber-50 text-amber-700',
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

export default function CastDashboard({ cast }: { cast: Cast }) {
  const [activeTab, setActiveTab] = useState('overview')

  const totalFollowers = PLATFORMS.reduce((s, p) =>
    s + (cast.platforms[p].connected ? cast.platforms[p].followers : 0), 0)

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div className={clsx('w-14 h-14 rounded-2xl text-xl flex items-center justify-center font-medium flex-shrink-0', cast.avatar_color)}>
          {cast.avatar_initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-semibold text-stone-800">{cast.display_name}</h1>
            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_STYLE[cast.status])}>
              <span className={clsx('status-dot mr-1.5 inline-block', `status-${cast.status}`)} />
              {STATUS_LABEL[cast.status]}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm text-stone-400">{cast.age}歳 · {cast.area}</span>
            <span className="text-sm text-stone-400">シフト {cast.shift_start}〜{cast.shift_end}</span>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {cast.personality_tags.map(tag => (
              <span key={tag} className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-semibold text-stone-800">{totalFollowers.toLocaleString()}</div>
          <div className="text-xs text-stone-400">総フォロワー</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-stone-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'text-xs px-4 py-1.5 rounded-lg font-medium transition-all',
              activeTab === tab.key
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: 概要 */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-slide-up">
          <p className="text-sm text-stone-500 leading-relaxed">{cast.character_desc}</p>

          {/* Platform accounts */}
          <div className="grid grid-cols-2 gap-3">
            {PLATFORMS.map(p => {
              const acc = cast.platforms[p]
              if (!acc.connected) return (
                <div key={p} className="bg-white rounded-xl border border-stone-100 px-4 py-3.5 opacity-40">
                  <div className="text-xs font-medium text-stone-400 mb-1">{PLATFORM_LABELS[p]}</div>
                  <div className="text-xs text-stone-300">未連携</div>
                </div>
              )
              return (
                <div key={p} className="bg-white rounded-xl border border-stone-100 px-4 py-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-stone-500">{PLATFORM_LABELS[p]}</span>
                    <span className="text-xs text-stone-400">@{acc.username}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xl font-semibold text-stone-800">{acc.followers.toLocaleString()}</div>
                      <div className="text-xs text-stone-400">フォロワー</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-stone-600">{acc.engagement_rate}%</div>
                      <div className="text-xs text-stone-400">ENG率</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-stone-600">{acc.posts_today}</div>
                      <div className="text-xs text-stone-400">本日投稿</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Monthly stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-stone-100 px-4 py-3.5">
              <div className="text-xs text-stone-400 mb-1">月間予測予約数</div>
              <div className="text-2xl font-semibold text-stone-800">{cast.monthly_bookings_estimated}</div>
              <div className="text-xs text-stone-400">件</div>
            </div>
            <div className="bg-white rounded-xl border border-stone-100 px-4 py-3.5">
              <div className="text-xs text-stone-400 mb-1">月間フォロワー増加</div>
              <div className="text-2xl font-semibold text-stone-800">+{cast.monthly_follower_growth.toLocaleString()}</div>
              <div className="text-xs text-stone-400">人</div>
            </div>
            <div className="bg-white rounded-xl border border-stone-100 px-4 py-3.5">
              <div className="text-xs text-stone-400 mb-1">月間総投稿数</div>
              <div className="text-2xl font-semibold text-stone-800">
                {PLATFORMS.reduce((s, p) => s + cast.platforms[p].posts_this_month, 0)}
              </div>
              <div className="text-xs text-stone-400">件</div>
            </div>
          </div>

          {/* Posts timeline */}
          <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
              <span className="text-sm font-medium text-stone-700">本日の投稿スケジュール</span>
              <span className="text-xs text-stone-400">{cast.posts.length}件</span>
            </div>
            <div className="divide-y divide-stone-50">
              {cast.posts
                .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
                .map(post => (
                  <div key={post.id} className="px-5 py-3.5 flex items-start gap-3">
                    <div className="text-xs text-stone-400 w-12 flex-shrink-0 pt-0.5">{formatTime(post.scheduled_at)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={clsx('text-xs px-1.5 py-0.5 rounded font-medium', POST_TYPE_COLORS[post.type])}>
                          {POST_TYPE_LABELS[post.type]}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line line-clamp-2">{post.content}</p>
                      {post.status === 'posted' && (post.likes !== undefined) && (
                        <div className="flex gap-3 mt-1.5">
                          <span className="text-xs text-stone-400">♥ {post.likes}</span>
                          <span className="text-xs text-stone-400">↺ {post.reposts}</span>
                          <span className="text-xs text-stone-400">💬 {post.replies}</span>
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
        <div className="bg-white rounded-xl border border-stone-100 p-6 animate-slide-up">
          <p className="text-sm text-stone-500">キャラ設定機能は実装予定です。</p>
        </div>
      )}

      {/* Tab: 分析 */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-xl border border-stone-100 p-6 animate-slide-up">
          <p className="text-sm text-stone-500">分析機能は実装予定です。</p>
        </div>
      )}
    </div>
  )
}
