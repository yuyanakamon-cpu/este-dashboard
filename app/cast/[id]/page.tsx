'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import CastSidebar from '@/components/cast/CastSidebar'
import CastDashboard from '@/components/cast/CastDashboard'
import BottomNav from '@/components/cast/BottomNav'
import type { Cast } from '@/lib/types'

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

const AVATAR_COLORS = [
  'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700',
  'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700',
  'bg-green-100 text-green-700', 'bg-teal-100 text-teal-700',
]

function buildCast(auth: AuthData): Cast {
  const sns = auth.sns_status ?? {}
  const colorIdx = parseInt(auth.cast_id.replace('cast-', '') || '0') % AVATAR_COLORS.length
  const name = auth.display_name || auth.cast_id

  return {
    id: auth.cast_id,
    name,
    display_name: name,
    age: 0,
    area: '',
    status: 'off_shift',
    avatar_initial: name.charAt(0),
    avatar_color: AVATAR_COLORS[colorIdx],
    character_desc: `${name}のプロフィールです。`,
    personality_tags: [],
    shift_start: '--:--',
    shift_end: '--:--',
    shift_days: [],
    platforms: {
      x:         { connected: !!sns.x?.connected,         username: sns.x?.username ?? '',         followers: 0, posts_today: 0, posts_this_month: 0, engagement_rate: 0 },
      bluesky:   { connected: !!sns.bluesky?.connected,   username: sns.bluesky?.username ?? '',   followers: 0, posts_today: 0, posts_this_month: 0, engagement_rate: 0 },
      threads:   { connected: !!sns.threads?.connected,   username: sns.threads?.username ?? '',   followers: 0, posts_today: 0, posts_this_month: 0, engagement_rate: 0 },
      instagram: { connected: !!sns.instagram?.connected, username: sns.instagram?.username ?? '', followers: 0, posts_today: 0, posts_this_month: 0, engagement_rate: 0 },
    },
    posts: [],
    monthly_bookings_estimated: 0,
    monthly_follower_growth: 0,
  }
}

export default function CastPage() {
  const router = useRouter()
  const params = useParams()
  const [cast, setCast] = useState<Cast | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const stored = sessionStorage.getItem('cast_auth')
    if (!stored) { router.push('/cast-login'); return }
    const auth = JSON.parse(stored) as AuthData
    if (auth.cast_id !== params.id) { router.push('/cast-login'); return }
    setCast(buildCast(auth))
  }, [router, params.id])

  if (!cast) return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center">
      <div className="text-stone-400 text-sm">読み込み中...</div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-stone-50">
      <CastSidebar cast={cast} />
      <main className="flex-1 overflow-auto" style={{ marginLeft: 'var(--sidebar-width)' }}>
        <CastDashboard cast={cast} activeTab={activeTab} onTabChange={setActiveTab} />
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
