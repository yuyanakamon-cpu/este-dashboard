'use client'

import clsx from 'clsx'

const NAV_ITEMS = [
  { key: 'overview',   label: '概要',     emoji: '📊' },
  { key: 'posts',      label: '投稿',     emoji: '✍️' },
  { key: 'char',       label: 'キャラ',   emoji: '🎭' },
  { key: 'analytics',  label: '分析',     emoji: '📈' },
]

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-edge flex md:hidden z-50 safe-area-pb">
      {NAV_ITEMS.map(item => (
        <button
          key={item.key}
          onClick={() => onTabChange(item.key)}
          className={clsx(
            'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
            activeTab === item.key ? 'text-burgundy' : 'text-ink-3'
          )}
        >
          <span className="text-lg leading-none">{item.emoji}</span>
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
