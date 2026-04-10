import type { Platform, PostType } from '@/lib/types'

// ─────────────────────────────────────────────
// スケジュール済み投稿
// ─────────────────────────────────────────────
export type ScheduleStatus =
  | 'pending'    // 実行待ち
  | 'processing' // 実行中
  | 'sent'       // 送信完了
  | 'failed'     // 失敗
  | 'cancelled'  // キャンセル済み
  | 'skipped'    // スキップ（シフト外など）

export interface ScheduledPost {
  id: string
  cast_id: string
  cast_name: string
  platforms: Platform[]
  post_type: PostType
  content: string           // 投稿テキスト（AI生成 or 手動）
  scheduled_at: string      // ISO8601
  status: ScheduleStatus
  created_at: string
  updated_at: string
  // 実行結果
  results?: PlatformResult[]
  error?: string
  retry_count: number
  max_retries: number
}

export interface PlatformResult {
  platform: Platform
  status: 'sent' | 'failed' | 'skipped'
  post_id?: string          // SNS側の投稿ID（実API接続後に使用）
  url?: string              // 投稿URL
  error?: string
  sent_at?: string
}

// ─────────────────────────────────────────────
// スケジュール設定（キャストごと）
// ─────────────────────────────────────────────
export interface PostingSlot {
  hour: number              // 0-23
  minute: number            // 0, 15, 30, 45
  post_types: PostType[]    // この時間帯に投稿する種別の候補
  platforms: Platform[]     // この時間帯に投稿するSNS
  enabled: boolean
}

export interface CastScheduleConfig {
  cast_id: string
  enabled: boolean          // 自動スケジュールON/OFF
  auto_approve: boolean     // AI生成後に自動投稿（false=承認待ち）
  daily_slots: PostingSlot[] // 1日の投稿スロット定義
  weekend_boost: boolean    // 金土は投稿頻度1.5倍
  midnight_post: boolean    // 深夜投稿（0-2時）
  updated_at: string
}

// ─────────────────────────────────────────────
// 投稿ログ
// ─────────────────────────────────────────────
export interface PostLog {
  id: string
  scheduled_post_id: string
  cast_id: string
  cast_name: string
  platform: Platform
  post_type: PostType
  content: string
  status: 'sent' | 'failed'
  post_id?: string
  url?: string
  error?: string
  executed_at: string
}

// ─────────────────────────────────────────────
// キュー実行結果
// ─────────────────────────────────────────────
export interface RunResult {
  processed: number
  sent: number
  failed: number
  skipped: number
  details: Array<{
    post_id: string
    cast_name: string
    status: ScheduleStatus
    platforms: Platform[]
  }>
}
