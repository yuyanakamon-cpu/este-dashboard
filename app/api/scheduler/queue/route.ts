import { NextRequest, NextResponse } from 'next/server'
import { QueueStore, ConfigStore } from '@/lib/scheduler/store'
import { generateSchedule, createDefaultConfig } from '@/lib/scheduler/planner'
import { runSingle } from '@/lib/scheduler/runner'
import { CASTS } from '@/lib/mock-data'
import type { ScheduledPost } from '@/lib/scheduler/types'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'

// GET /api/scheduler/queue — キュー一覧取得
// ?castId=xxx でフィルタ
// ?status=pending でステータスフィルタ
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const castId = searchParams.get('castId')
  const status = searchParams.get('status')

  let posts = castId ? QueueStore.getByCastId(castId) : QueueStore.getAll()

  if (status) {
    posts = posts.filter(p => p.status === status)
  }

  // 日時順に並べる
  posts.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))

  return NextResponse.json({ posts, count: posts.length })
}

// POST /api/scheduler/queue — 投稿を追加 or 操作
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  try {
    switch (action) {

      // ── スケジュールを自動生成 ──
      case 'generate': {
        const { castId, days = 7 } = body
        const cast = CASTS.find(c => c.id === castId)
        if (!cast) return NextResponse.json({ error: 'キャストが見つかりません' }, { status: 404 })

        // 既存のpendingを削除してから再生成
        const existing = QueueStore.getByCastId(castId)
        existing.filter(p => p.status === 'pending').forEach(p => QueueStore.delete(p.id))

        let config = ConfigStore.getByCastId(castId)
        if (!config) {
          config = createDefaultConfig(cast)
          ConfigStore.upsert(config)
        }

        const posts = generateSchedule(cast, config, days)
        QueueStore.upsertMany(posts)

        return NextResponse.json({
          success: true,
          generated: posts.length,
          posts: posts.slice(0, 20), // プレビューは20件まで
        })
      }

      // ── 全キャストのスケジュールを生成 ──
      case 'generate_all': {
        const { days = 7 } = body
        let totalGenerated = 0

        for (const cast of CASTS) {
          let config = ConfigStore.getByCastId(cast.id)
          if (!config) {
            config = createDefaultConfig(cast)
            ConfigStore.upsert(config)
          }
          if (!config.enabled) continue

          const existing = QueueStore.getByCastId(cast.id)
          existing.filter(p => p.status === 'pending').forEach(p => QueueStore.delete(p.id))

          const posts = generateSchedule(cast, config, days)
          QueueStore.upsertMany(posts)
          totalGenerated += posts.length
        }

        return NextResponse.json({ success: true, total_generated: totalGenerated })
      }

      // ── 手動で投稿を追加 ──
      case 'add': {
        const { castId, castName, platforms, postType, content, scheduledAt } = body
        const now = new Date().toISOString()
        const post: ScheduledPost = {
          id: nanoid(12),
          cast_id: castId,
          cast_name: castName,
          platforms,
          post_type: postType,
          content: content ?? '',
          scheduled_at: scheduledAt,
          status: 'pending',
          created_at: now,
          updated_at: now,
          retry_count: 0,
          max_retries: 3,
        }
        QueueStore.upsert(post)
        return NextResponse.json({ success: true, post })
      }

      // ── 投稿テキストを更新 ──
      case 'update_content': {
        const { postId, content } = body
        QueueStore.updateStatus(postId, { content })
        return NextResponse.json({ success: true })
      }

      // ── 投稿をキャンセル ──
      case 'cancel': {
        const { postId } = body
        QueueStore.updateStatus(postId, { status: 'cancelled' })
        return NextResponse.json({ success: true })
      }

      // ── 投稿を今すぐ実行 ──
      case 'run_now': {
        const { postId } = body
        const results = await runSingle(postId)
        return NextResponse.json({ success: true, results })
      }

      // ── 今すぐ投稿（新規作成 → 即実行） ──
      case 'immediate': {
        const { castId, castName, platforms, postType, content } = body
        if (!content?.trim()) {
          return NextResponse.json({ error: '投稿テキストが空です' }, { status: 400 })
        }
        if (!platforms?.length) {
          return NextResponse.json({ error: '投稿先プラットフォームを選んでください' }, { status: 400 })
        }

        const now = new Date().toISOString()
        const post: ScheduledPost = {
          id: nanoid(12),
          cast_id: castId,
          cast_name: castName ?? castId,
          platforms,
          post_type: postType ?? 'personality',
          content,
          scheduled_at: now,
          status: 'pending',
          created_at: now,
          updated_at: now,
          retry_count: 0,
          max_retries: 1,
        }
        QueueStore.upsert(post)

        // Supabaseからキャスト固有の認証情報を取得して投稿
        const results = await runSingle(post.id, castId)
        const allFailed = results.every(r => r.status === 'failed')
        return NextResponse.json({
          success: !allFailed,
          results,
          post_id: post.id,
        })
      }

      // ── 古い投稿をクリーンアップ ──
      case 'cleanup': {
        const deleted = QueueStore.cleanup()
        return NextResponse.json({ success: true, deleted })
      }

      default:
        return NextResponse.json({ error: `不明なアクション: ${action}` }, { status: 400 })
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'エラーが発生しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/scheduler/queue?postId=xxx
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId が必要です' }, { status: 400 })

  QueueStore.delete(postId)
  return NextResponse.json({ success: true })
}
