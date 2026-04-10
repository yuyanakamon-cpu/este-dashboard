import type { Cast } from '@/lib/types'
import type { Platform } from '@/lib/types'
import type { ScheduledPost, CastScheduleConfig } from './types'
import type { GrowthPhase } from './ban-guard'
import {
  banGuard,
  getOptimalPostTimes,
  getRecommendedPostCount,
} from './ban-guard'
import { CastStateStore } from './cast-state'
import { nanoid } from 'nanoid'

// ─────────────────────────────────────────────
// デフォルト設定生成
// ─────────────────────────────────────────────
export function createDefaultConfig(cast: Cast): CastScheduleConfig {
  return {
    cast_id: cast.id,
    enabled: true,
    auto_approve: false,
    daily_slots: [],             // BanGuardが動的に生成するため固定スロット不要
    weekend_boost: true,
    midnight_post: false,
    updated_at: new Date().toISOString(),
  }
}

// ─────────────────────────────────────────────
// 接続済みプラットフォームのみ返す
// ─────────────────────────────────────────────
function getConnectedPlatforms(platforms: Platform[], cast: Cast): Platform[] {
  return platforms.filter(p => cast.platforms[p]?.connected)
}

// ─────────────────────────────────────────────
// 曜日がシフトに含まれるかチェック
// ─────────────────────────────────────────────
function isShiftDay(date: Date, cast: Cast): boolean {
  return cast.shift_days.includes(date.getDay())
}

// ─────────────────────────────────────────────
// シフト時間内かチェック
// ─────────────────────────────────────────────
function isInShiftHours(date: Date, cast: Cast): boolean {
  const h = date.getHours()
  const m = date.getMinutes()
  const totalMinutes = h * 60 + m

  const [startH, startM] = cast.shift_start.split(':').map(Number)
  const [endH, endM] = cast.shift_end.split(':').map(Number)

  const startTotal = startH * 60 + startM
  let endTotal = endH * 60 + endM
  if (endTotal <= startTotal) endTotal += 24 * 60  // 日またぎ

  return totalMinutes >= startTotal && totalMinutes <= endTotal
}

// ─────────────────────────────────────────────
// Instagramは週3〜4回に制限（アルゴリズム対策）
// ─────────────────────────────────────────────
function applyInstagramLimit(posts: ScheduledPost[], days: number): ScheduledPost[] {
  const maxInstagramPerWeek = Math.ceil(days * (4 / 7))
  let instaCount = 0

  return posts.map(post => {
    if (post.platforms.includes('instagram')) {
      if (instaCount >= maxInstagramPerWeek) {
        return {
          ...post,
          platforms: post.platforms.filter(p => p !== 'instagram'),
        }
      }
      instaCount++
    }
    return post
  }).filter(p => p.platforms.length > 0)
}

// ─────────────────────────────────────────────
// メイン: BanGuard統合スケジュール生成
// ─────────────────────────────────────────────
export function generateSchedule(
  cast: Cast,
  config: CastScheduleConfig,
  days = 7,
  startDate?: Date,
): ScheduledPost[] {
  const posts: ScheduledPost[] = []
  const base = startDate ?? new Date()

  // キャストの状態を取得（フェーズ・直近投稿タイプ）
  const castState = CastStateStore.getOrCreate(cast.id)
  const phase: GrowthPhase = castState.is_paused ? 'warmup' : castState.phase
  const recentTypes = [...castState.recent_post_types]

  for (let d = 0; d < days; d++) {
    const date = new Date(base)
    date.setDate(base.getDate() + d)

    // シフト日でなければスキップ
    if (!isShiftDay(date, cast)) continue

    // 週末ブースト（金土日）
    const isWeekendBoostDay = config.weekend_boost && [5, 6, 0].includes(date.getDay())
    const baseCount = getRecommendedPostCount(phase)
    const dailyCount = isWeekendBoostDay
      ? Math.min(baseCount + 2, 7)  // 週末は最大2本増加（上限7本）
      : baseCount

    // 深夜投稿追加
    const totalCount = config.midnight_post ? dailyCount + 1 : dailyCount

    // 最適な投稿時間を取得（BanGuardから）
    const optimalTimes = getOptimalPostTimes(totalCount, date)

    // 深夜スロット追加
    if (config.midnight_post) {
      const midnightTime = new Date(date)
      midnightTime.setHours(1, Math.floor(Math.random() * 30), 0, 0)
      optimalTimes.push(midnightTime)
    }

    // 投稿タイプをローテーションで選択
    const selectedTypes = banGuard.pickContentType(recentTypes, optimalTimes.length)

    for (let i = 0; i < optimalTimes.length; i++) {
      const scheduledAt = optimalTimes[i]
      const postType = selectedTypes[i]

      // シフト時間外はスキップ
      if (!isInShiftHours(scheduledAt, cast)) continue

      // プラットフォームを決定（タイプと時間帯で使い分け）
      const platforms = selectPlatformsForSlot(scheduledAt, postType, cast)
      if (platforms.length === 0) continue

      recentTypes.push(postType)

      const now = new Date().toISOString()
      posts.push({
        id: nanoid(12),
        cast_id: cast.id,
        cast_name: cast.name,
        platforms,
        post_type: postType,
        content: '',
        scheduled_at: scheduledAt.toISOString(),
        status: 'pending',
        created_at: now,
        updated_at: now,
        retry_count: 0,
        max_retries: 2,  // フェーズによる（warmupは少なめ）
      })
    }
  }

  // Instagram回数制限を適用
  return applyInstagramLimit(posts, days)
}

// ─────────────────────────────────────────────
// 時間帯・投稿タイプに応じてプラットフォームを選択
// ─────────────────────────────────────────────
function selectPlatformsForSlot(
  time: Date,
  postType: string,
  cast: Cast,
): Platform[] {
  const hour = time.getHours()
  const timeWeight = banGuard.getTimeWeight(hour)

  // 全プラットフォームの候補
  const allPlatforms: Platform[] = ['x', 'bluesky', 'threads', 'instagram']

  let selected: Platform[] = []

  // 重要時間帯（17〜21時）は全SNSに配信
  if (timeWeight >= 4) {
    selected = allPlatforms
  }
  // 朝・昼はX + Bluesky メイン
  else if (timeWeight >= 2) {
    selected = ['x', 'bluesky', 'threads']
  }
  // 深夜はXのみ
  else if (hour >= 0 && hour < 4) {
    selected = ['x']
  }
  // その他
  else {
    selected = ['x', 'bluesky']
  }

  // Instagramは写真・動画投稿のみ
  if (postType !== 'media' && selected.includes('instagram')) {
    selected = selected.filter(p => p !== 'instagram')
  }

  // 接続済みプラットフォームのみ
  return getConnectedPlatforms(selected, cast)
}

// ─────────────────────────────────────────────
// 緊急投稿生成（即時実行用）
// ─────────────────────────────────────────────
export function generateEmergencyPost(
  cast: Cast,
  type: 'vacancy' | 'shift_announce',
): ScheduledPost | null {
  const now = new Date()
  const platforms = getConnectedPlatforms(['x', 'bluesky'], cast)
  if (platforms.length === 0) return null

  return {
    id: nanoid(12),
    cast_id: cast.id,
    cast_name: cast.name,
    platforms,
    post_type: type,
    content: '',  // 生成または手動入力
    scheduled_at: now.toISOString(),
    status: 'pending',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    retry_count: 0,
    max_retries: 2,
  }
}

// ─────────────────────────────────────────────
// 次の投稿時間を取得
// ─────────────────────────────────────────────
export function getNextPostTime(posts: ScheduledPost[]): ScheduledPost | null {
  const now = new Date().toISOString()
  return posts
    .filter(p => p.status === 'pending' && p.scheduled_at > now)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0] ?? null
}
