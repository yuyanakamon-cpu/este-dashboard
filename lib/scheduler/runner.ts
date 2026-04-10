import type { ScheduledPost, PostLog, RunResult, PlatformResult } from './types'
import { QueueStore, LogStore } from './store'
import { CastStateStore } from './cast-state'
import { banGuard } from './ban-guard'
import { getAdapter } from '@/lib/platforms/adapter'
import { nanoid } from 'nanoid'

// ─────────────────────────────────────────────
// キューを処理
// ─────────────────────────────────────────────
export async function runQueue(options?: { dryRun?: boolean }): Promise<RunResult> {
  const result: RunResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    details: [],
  }

  const pendingPosts = QueueStore.getPending()
  if (pendingPosts.length === 0) return result

  for (const post of pendingPosts) {
    result.processed++

    // ── BanGuard チェック1: キャスト一時停止中 ──
    const castState = CastStateStore.getOrCreate(post.cast_id)
    if (castState.is_paused) {
      result.skipped++
      QueueStore.updateStatus(post.id, {
        status: 'skipped',
        error: `一時停止中: ${castState.pause_reason ?? '手動停止'}`,
      })
      result.details.push({ post_id: post.id, cast_name: post.cast_name, status: 'skipped', platforms: post.platforms })
      continue
    }

    // ── BanGuard チェック2: 今日の投稿上限 ──
    const state = CastStateStore.resetDailyCountIfNeeded(post.cast_id)
    const phaseConfig = banGuard.getPhaseConfig(state.phase)
    if (state.today_post_count >= phaseConfig.daily_post_max) {
      result.skipped++
      QueueStore.updateStatus(post.id, {
        status: 'skipped',
        error: `本日の投稿上限（${phaseConfig.daily_post_max}件）に達しました`,
      })
      result.details.push({ post_id: post.id, cast_name: post.cast_name, status: 'skipped', platforms: post.platforms })
      continue
    }

    // ── BanGuard チェック3: 投稿間隔 ──
    if (state.last_post_at) {
      const lastPostTime = new Date(state.last_post_at)
      if (!banGuard.isIntervalSafe(lastPostTime, state.phase)) {
        result.skipped++
        QueueStore.updateStatus(post.id, {
          status: 'skipped',
          error: `投稿間隔が短すぎます（${phaseConfig.min_interval_hours}時間以上必要）`,
        })
        result.details.push({ post_id: post.id, cast_name: post.cast_name, status: 'skipped', platforms: post.platforms })
        continue
      }
    }

    // ── テキスト未生成チェック ──
    if (!post.content || post.content.trim().length === 0) {
      result.skipped++
      QueueStore.updateStatus(post.id, {
        status: 'skipped',
        error: 'テキストが未生成です',
      })
      result.details.push({ post_id: post.id, cast_name: post.cast_name, status: 'skipped', platforms: post.platforms })
      continue
    }

    // ── BanGuard チェック4: コンテンツリスク評価 ──
    const riskAssessment = banGuard.assess(post.content)
    if (riskAssessment.level === 'danger') {
      // 自動修正を試みる
      if (riskAssessment.modified_content) {
        QueueStore.updateStatus(post.id, {
          content: riskAssessment.modified_content,
          error: `リスクワードを自動修正しました: ${riskAssessment.factors.join(', ')}`,
        })
        // 修正後のコンテンツで続行
        post.content = riskAssessment.modified_content
      } else {
        result.skipped++
        QueueStore.updateStatus(post.id, {
          status: 'skipped',
          error: `コンテンツリスクが高すぎます（スコア${riskAssessment.score}）: ${riskAssessment.factors.join(', ')}`,
        })
        result.details.push({ post_id: post.id, cast_name: post.cast_name, status: 'skipped', platforms: post.platforms })
        continue
      }
    }

    // ── DryRunモード ──
    if (options?.dryRun) {
      console.log(`[DryRun] ${post.cast_name}: "${post.content.slice(0, 50)}..." → ${post.platforms.join(',')}`)
      result.sent++
      continue
    }

    // ── 処理中に更新 ──
    QueueStore.updateStatus(post.id, { status: 'processing' })

    try {
      const platformResults = await postToAllPlatforms(post)
      const allFailed = platformResults.every(r => r.status === 'failed')
      const someSent = platformResults.some(r => r.status === 'sent')
      const finalStatus = allFailed ? 'failed' : 'sent'

      QueueStore.updateStatus(post.id, {
        status: finalStatus,
        results: platformResults,
        error: allFailed ? platformResults.map(r => r.error).filter(Boolean).join(', ') : undefined,
      })

      // ログ記録
      LogStore.appendMany(platformResults.map(r => buildLog(post, r)))

      // キャスト状態を更新
      CastStateStore.recordPost(post.cast_id, post.post_type, someSent)

      if (someSent) result.sent++
      else result.failed++

      result.details.push({ post_id: post.id, cast_name: post.cast_name, status: finalStatus, platforms: post.platforms })

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '不明なエラー'
      const retryCount = post.retry_count + 1
      const shouldRetry = retryCount <= post.max_retries

      if (shouldRetry) {
        const retryAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
        QueueStore.updateStatus(post.id, {
          status: 'pending',
          retry_count: retryCount,
          scheduled_at: retryAt,
          error: `[リトライ${retryCount}/${post.max_retries}] ${errorMsg}`,
        })
      } else {
        QueueStore.updateStatus(post.id, {
          status: 'failed',
          retry_count: retryCount,
          error: `[最終失敗] ${errorMsg}`,
        })
        CastStateStore.recordPost(post.cast_id, post.post_type, false)
        result.failed++
      }

      result.details.push({
        post_id: post.id,
        cast_name: post.cast_name,
        status: shouldRetry ? 'pending' : 'failed',
        platforms: post.platforms,
      })
    }
  }

  return result
}

// ─────────────────────────────────────────────
// 全プラットフォームに投稿
// ─────────────────────────────────────────────
async function postToAllPlatforms(post: ScheduledPost): Promise<PlatformResult[]> {
  const results = await Promise.allSettled(
    post.platforms.map(platform => getAdapter(platform).post(post.content))
  )

  return results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value
    return {
      platform: post.platforms[i],
      status: 'failed' as const,
      error: result.reason instanceof Error ? result.reason.message : '不明なエラー',
    }
  })
}

function buildLog(post: ScheduledPost, result: PlatformResult): PostLog {
  return {
    id: nanoid(12),
    scheduled_post_id: post.id,
    cast_id: post.cast_id,
    cast_name: post.cast_name,
    platform: result.platform,
    post_type: post.post_type,
    content: post.content,
    status: result.status === 'sent' ? 'sent' : 'failed',
    post_id: result.post_id,
    url: result.url,
    error: result.error,
    executed_at: new Date().toISOString(),
  }
}

// ─────────────────────────────────────────────
// 単一投稿を即時実行
// ─────────────────────────────────────────────
export async function runSingle(postId: string): Promise<PlatformResult[]> {
  const post = QueueStore.getById(postId)
  if (!post) throw new Error(`投稿 ${postId} が見つかりません`)
  if (!post.content) throw new Error('テキストが未設定です')

  // BanGuardチェック
  const risk = banGuard.assess(post.content)
  if (risk.level === 'danger' && !risk.modified_content) {
    throw new Error(`リスクが高すぎます: ${risk.factors.join(', ')}`)
  }

  const content = risk.modified_content ?? post.content
  if (content !== post.content) {
    QueueStore.updateStatus(postId, { content })
    post.content = content
  }

  QueueStore.updateStatus(postId, { status: 'processing' })
  const results = await postToAllPlatforms(post)
  const allFailed = results.every(r => r.status === 'failed')

  QueueStore.updateStatus(postId, {
    status: allFailed ? 'failed' : 'sent',
    results,
    error: allFailed ? results.map(r => r.error).filter(Boolean).join(', ') : undefined,
  })

  LogStore.appendMany(results.map(r => buildLog(post, r)))
  CastStateStore.recordPost(post.cast_id, post.post_type, !allFailed)

  return results
}
