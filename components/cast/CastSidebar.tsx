'use client'

import { Bell, Zap } from 'lucide-react'
import type { Cast } from '@/lib/types'
import clsx from 'clsx'

interface CastSidebarProps {
  cast: Cast
}

const NAV_ITEMS = [
  { id: 'overview',   label: '概要',       emoji: '📊' },
  { id: 'posts',      label: '投稿管理',   emoji: '✍️' },
  { id: 'character',  label: 'キャラ設定', emoji: '🎭' },
  { id: 'analytics',  label: '分析',       emoji: '📈' },
]

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  on_shift:  { label: '出勤中', cls: 'text-green-600' },
  off_shift: { label: '休み',   cls: 'text-stone-400' },
  break:     { label: '休憩中', cls: 'text-amber-600' },
}

export default function CastSidebar({ cast }: CastSidebarProps) {
  const status = STATUS_MAP[cast.status] || STATUS_MAP['off_shift']

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 h-full bg-white border-r border-stone-100 flex-col z-40"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* ロゴ */}
      <div className="px-5 py-5 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-stone-800">ESTE SNS</div>
            <div className="text-[10px] text-stone-400 leading-none">自動運用システム</div>
          </div>
        </div>
      </div>

      {/* キャストプロフィール（自分だけ） */}
      <div className="mx-3 mb-2 p-3 bg-stone-50 rounded-xl border border-stone-100">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
            cast.avatar_color
          )}>
            {cast.avatar_initial}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-stone-800 text-sm truncate">{cast.name}</div>
            <div className="text-[11px] text-stone-400 truncate">{cast.area} · {cast.age}歳</div>
            <div className={clsx('text-[11px] font-medium flex items-center gap-1 mt-0.5', status.cls)}>
              <span className={clsx('status-dot', `status-${cast.status}`)} />
              {status.label}
            </div>
          </div>
        </div>

        {/* シフト時間 */}
        <div className="mt-2.5 pt-2.5 border-t border-stone-200">
          <div className="text-[10px] text-stone-400 mb-0.5">本日のシフト</div>
          <div className="text-xs font-medium text-stone-600">
            {cast.shift_start} 〜 {cast.shift_end}
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-4 pb-1">
          <div className="text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-1">メニュー</div>
        </div>
        <div className="px-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-all cursor-pointer"
            >
              <span className="text-sm">{item.emoji}</span>
              <span className="font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* プラットフォーム接続状況 */}
        <div className="px-4 pt-5 pb-1">
          <div className="text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-2">SNS接続状況</div>
        </div>
        <div className="px-3 space-y-1">
          {(
            [
              { key: 'x',         icon: '𝕏',  label: 'Twitter' },
              { key: 'bluesky',   icon: '🦋', label: 'Bluesky' },
              { key: 'threads',   icon: '🧵', label: 'Threads' },
              { key: 'instagram', icon: '📷', label: 'Instagram' },
            ] as const
          ).map(({ key, icon, label }) => {
            const acc = cast.platforms[key]
            return (
              <div key={key} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs">{icon}</span>
                  <span className="text-[12px] text-stone-500">{label}</span>
                </div>
                {acc.connected ? (
                  <span className="text-[10px] text-green-600 font-medium">接続中</span>
                ) : (
                  <span className="text-[10px] text-red-400">未接続</span>
                )}
              </div>
            )
          })}
        </div>

        {/* 設定 */}
        <div className="px-3 pt-4 space-y-0.5">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-stone-400 hover:bg-stone-50 hover:text-stone-600 transition-all cursor-pointer">
            <Bell size={14} />
            <span>通知設定</span>
          </div>
        </div>
      </nav>

      {/* フッター */}
      <div className="px-4 py-3 border-t border-stone-100">
        <div className="text-[10px] text-stone-400 text-center">v1.0.0 — 2026.04</div>
      </div>
    </aside>
  )
}
