import { NextRequest, NextResponse } from 'next/server'
import { LogStore } from '@/lib/scheduler/store'

export const runtime = 'nodejs'

// GET /api/scheduler/logs
// ?castId=xxx でフィルタ
// ?limit=50
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const castId = searchParams.get('castId')
  const limit = parseInt(searchParams.get('limit') ?? '100')

  const logs = castId
    ? LogStore.getByCastId(castId, limit)
    : LogStore.getRecent(limit)

  // 統計
  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === 'sent').length,
    failed: logs.filter(l => l.status === 'failed').length,
    by_platform: {
      x:         logs.filter(l => l.platform === 'x').length,
      bluesky:   logs.filter(l => l.platform === 'bluesky').length,
      threads:   logs.filter(l => l.platform === 'threads').length,
      instagram: logs.filter(l => l.platform === 'instagram').length,
    },
  }

  return NextResponse.json({ logs, stats })
}
