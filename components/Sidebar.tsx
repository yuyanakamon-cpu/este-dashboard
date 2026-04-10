'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Bell, Settings, Zap, CalendarClock } from 'lucide-react'
import { CASTS } from '@/lib/mock-data'
import clsx from 'clsx'

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full bg-white border-r border-stone-100 flex flex-col z-40"
      style={{ width: 'var(--sidebar-width)' }}>

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

      {/* メニュー */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-1">
          <NavItem href="/master/dashboard" icon={<LayoutDashboard size={15} />} label="マスター管理" active={pathname === '/master/dashboard'} />
        </div>

        {/* キャスト一覧 */}
        <div className="px-4 pt-4 pb-1">
          <div className="text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-2">キャスト</div>
        </div>
        <div className="px-3 space-y-0.5">
          {CASTS.map((cast) => (
            <Link
              key={cast.id}
              href={`/cast/${cast.id}`}
              className={clsx(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-sm group',
                pathname === `/cast/${cast.id}`
                  ? 'bg-rose-50 text-rose-700'
                  : 'text-stone-600 hover:bg-stone-50'
              )}
            >
              <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0', cast.avatar_color)}>
                {cast.avatar_initial}
              </div>
              <span className="flex-1 truncate font-medium text-[13px]">{cast.name}</span>
              <span className={clsx('status-dot shrink-0', `status-${cast.status}`)} />
            </Link>
          ))}
        </div>

        {/* ツール */}
        <div className="px-4 pt-5 pb-1">
          <div className="text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-2">ツール</div>
        </div>
        <div className="px-3 space-y-0.5">
          <NavItem href="/scheduler" icon={<CalendarClock size={15} />} label="スケジューラー" active={pathname === '/scheduler'} />
          <NavItem href="#" icon={<Bell size={15} />} label="通知設定" active={false} />
          <NavItem href="#" icon={<Settings size={15} />} label="システム設定" active={false} />
        </div>
      </nav>

      {/* フッター */}
      <div className="px-4 py-3 border-t border-stone-100">
        <div className="text-[10px] text-stone-400 text-center">v1.0.0 — 2026.04</div>
      </div>
    </aside>
  )
}

function NavItem({ href, icon, label, active }: {
  href: string; icon: React.ReactNode; label: string; active: boolean
}) {
  return (
    <Link href={href} className={clsx(
      'flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-[13px] font-medium',
      active ? 'bg-rose-50 text-rose-700' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
    )}>
      {icon}
      <span className="flex-1">{label}</span>
    </Link>
  )
}
