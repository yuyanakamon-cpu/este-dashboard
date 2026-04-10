import fs from 'fs'
import path from 'path'
import type { GrowthPhase } from './ban-guard'
import type { PostType } from '@/lib/types'

// ─────────────────────────────────────────────
// キャストごとの状態管理
// ─────────────────────────────────────────────
export interface CastPostingState {
  cast_id: string
  phase: GrowthPhase
  phase_started_at: string          // フェーズ開始日
  account_created_at: string        // アカウント開設日（フェーズ自動判定に使用）
  last_post_at: string | null       // 最後の投稿日時
  today_post_count: number          // 今日の投稿数
  today_date: string                // 今日の日付（YYYY-MM-DD）
  recent_post_types: PostType[]     // 直近10件の投稿タイプ（ローテーション管理）
  total_posts: number               // 累計投稿数
  consecutive_fail_count: number    // 連続失敗数（3回以上で自動停止）
  is_paused: boolean                // 手動一時停止フラグ
  pause_reason?: string
  updated_at: string
}

const STATE_FILE = path.join(process.cwd(), 'data', 'cast_states.json')

function readStates(): Record<string, CastPostingState> {
  try {
    if (!fs.existsSync(STATE_FILE)) return {}
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function writeStates(states: Record<string, CastPostingState>): void {
  const dir = path.dirname(STATE_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify(states, null, 2), 'utf-8')
}

export const CastStateStore = {
  get(castId: string): CastPostingState | null {
    const states = readStates()
    return states[castId] ?? null
  },

  getOrCreate(castId: string): CastPostingState {
    const existing = this.get(castId)
    if (existing) return existing

    const now = new Date().toISOString()
    const newState: CastPostingState = {
      cast_id: castId,
      phase: 'warmup',
      phase_started_at: now,
      account_created_at: now,
      last_post_at: null,
      today_post_count: 0,
      today_date: new Date().toISOString().split('T')[0],
      recent_post_types: [],
      total_posts: 0,
      consecutive_fail_count: 0,
      is_paused: false,
      updated_at: now,
    }
    this.upsert(newState)
    return newState
  },

  upsert(state: CastPostingState): void {
    const states = readStates()
    states[state.cast_id] = { ...state, updated_at: new Date().toISOString() }
    writeStates(states)
  },

  // 今日の投稿カウントをリセット（日付が変わった場合）
  resetDailyCountIfNeeded(castId: string): CastPostingState {
    const state = this.getOrCreate(castId)
    const today = new Date().toISOString().split('T')[0]
    if (state.today_date !== today) {
      const updated = { ...state, today_post_count: 0, today_date: today }
      this.upsert(updated)
      return updated
    }
    return state
  },

  // 投稿後に状態を更新
  recordPost(castId: string, postType: PostType, success: boolean): void {
    const state = this.resetDailyCountIfNeeded(castId)
    const recentTypes = [...state.recent_post_types, postType].slice(-10)

    const updated: CastPostingState = {
      ...state,
      last_post_at: new Date().toISOString(),
      today_post_count: success ? state.today_post_count + 1 : state.today_post_count,
      recent_post_types: recentTypes,
      total_posts: success ? state.total_posts + 1 : state.total_posts,
      consecutive_fail_count: success ? 0 : state.consecutive_fail_count + 1,
      // 連続失敗が3回以上で自動一時停止
      is_paused: !success && state.consecutive_fail_count + 1 >= 3 ? true : state.is_paused,
      pause_reason: !success && state.consecutive_fail_count + 1 >= 3
        ? '連続失敗3回のため自動一時停止しました。手動で再開してください。'
        : state.pause_reason,
    }
    this.upsert(updated)
  },

  // フェーズを手動で変更
  setPhase(castId: string, phase: GrowthPhase): void {
    const state = this.getOrCreate(castId)
    this.upsert({
      ...state,
      phase,
      phase_started_at: new Date().toISOString(),
    })
  },

  // 一時停止 / 再開
  setPaused(castId: string, paused: boolean, reason?: string): void {
    const state = this.getOrCreate(castId)
    this.upsert({
      ...state,
      is_paused: paused,
      pause_reason: paused ? reason : undefined,
      consecutive_fail_count: paused ? state.consecutive_fail_count : 0,
    })
  },

  getAll(): CastPostingState[] {
    return Object.values(readStates())
  },
}
