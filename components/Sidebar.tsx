'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Bell, Settings, CalendarClock } from 'lucide-react'
import { CASTS } from '@/lib/mock-data'
import clsx from 'clsx'

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="app-sidebar fixed left-0 top-0 h-full flex flex-col z-40"
      style={{ width: 'var(--sidebar-width)', background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>

      {/* ロゴ */}
      <div className="px-5 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--burgundy)' }}>
            <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z" />
          </svg>
          <div>
            <div className="font-serif text-base font-semibold tracking-[0.12em]" style={{ color: 'var(--burgundy)' }}>Esté</div>
            <div className="text-[9px] tracking-[0.24em] uppercase font-semibold" style={{ color: 'var(--text-3)' }}>SNS Atelier</div>
          </div>
        </div>
      </div>

      {/* メニュー */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-1">
          <NavItem href="/master/dashboard" icon={<LayoutDashboard size={15} />} label="マスター管理" active={pathname === '/master/dashboard'} />
        </div>

        <div className="px-4 pt-5 pb-1">
          <div className="text-[9px] font-semibold tracking-[0.24em] uppercase" style={{ color: 'var(--text-3)' }}>Cast</div>
        </div>
        <div className="px-3 space-y-0.5">
          {CASTS.map((cast) => {
            const active = pathname === `/cast/${cast.id}`
            return (
              <Link
                key={cast.id}
                href={`/cast/${cast.id}`}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-pd transition-all group text-sm"
                style={{
                  background: active ? 'rgba(114,47,55,0.06)' : 'transparent',
                  color: active ? 'var(--burgundy)' : 'var(--text-2)',
                  borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
                }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-serif font-semibold shrink-0"
                     style={{ background: active ? 'var(--gold-bg)' : 'var(--bg-soft)', color: active ? 'var(--gold-deep)' : 'var(--text-2)' }}>
                  {cast.avatar_initial}
                </div>
                <span className="flex-1 truncate font-medium text-[13px]">{cast.name}</span>
                <span className={clsx('pd-status-dot shrink-0', `status-${cast.status}`)} />
              </Link>
            )
          })}
        </div>

        <div className="px-4 pt-5 pb-1">
          <div className="text-[9px] font-semibold tracking-[0.24em] uppercase" style={{ color: 'var(--text-3)' }}>Tools</div>
        </div>
        <div className="px-3 space-y-0.5">
          <NavItem href="/scheduler" icon={<CalendarClock size={15} />} label="スケジューラー" active={pathname === '/scheduler'} />
          <NavItem href="#" icon={<Bell size={15} />} label="通知設定" active={false} />
          <NavItem href="#" icon={<Settings size={15} />} label="システム設定" active={false} />
        </div>
      </nav>

      {/* フッター */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-[10px] text-center tracking-[0.16em] uppercase font-medium" style={{ color: 'var(--text-3)' }}>v1.0 — 2026</div>
      </div>
    </aside>
  )
}

function NavItem({ href, icon, label, active }: {
  href: string; icon: React.ReactNode; label: string; active: boolean
}) {
  return (
    <Link href={href}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-pd transition-all text-[13px] font-medium"
      style={{
        background: active ? 'rgba(114,47,55,0.06)' : 'transparent',
        color: active ? 'var(--burgundy)' : 'var(--text-2)',
        borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
      }}>
      {icon}
      <span className="flex-1">{label}</span>
    </Link>
  )
}
