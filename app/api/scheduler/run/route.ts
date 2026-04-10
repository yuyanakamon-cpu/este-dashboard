import { NextRequest, NextResponse } from 'next/server'
import { runQueue } from '@/lib/scheduler/runner'

export const runtime = 'nodejs'

// ─────────────────────────────────────────────
// POST /api/scheduler/run
// キューを処理する cronエンドポイント
//
// 呼び出し方（例）:
//   Vercel Cron:  vercel.json に設定
//   外部cron:     curl -X POST https://your-app.com/api/scheduler/run
//                      -H "Authorization: Bearer YOUR_CRON_SECRET"
//   ローカル開発: 管理画面の「今すぐ実行」ボタンから手動起動
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // セキュリティ: cronシークレットで認証（本番環境では必須）
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get('Authorization')
    const provided = authHeader?.replace('Bearer ', '')
    if (provided !== cronSecret) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 })
    }
  }

  const { searchParams } = new URL(req.url)
  const dryRun = searchParams.get('dryRun') === 'true'

  try {
    console.log(`[Scheduler] Running queue... dryRun=${dryRun}`)
    const result = await runQueue({ dryRun })
    console.log(`[Scheduler] Done: processed=${result.processed} sent=${result.sent} failed=${result.failed}`)

    return NextResponse.json({
      success: true,
      dryRun,
      result,
      executed_at: new Date().toISOString(),
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'スケジューラーエラー'
    console.error('[Scheduler] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET: ヘルスチェック
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'POST /api/scheduler/run でキューを実行します',
    time: new Date().toISOString(),
  })
}
