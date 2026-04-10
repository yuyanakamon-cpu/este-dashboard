import fs from 'fs'
import path from 'path'
import type { ScheduledPost, PostLog, CastScheduleConfig } from './types'

// ─────────────────────────────────────────────
// データファイルのパス（プロジェクトルート/data/）
// Supabase接続時はこのファイルをまるごと置き換える
// ─────────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), 'data')
const QUEUE_FILE    = path.join(DATA_DIR, 'queue.json')
const LOGS_FILE     = path.join(DATA_DIR, 'logs.json')
const CONFIGS_FILE  = path.join(DATA_DIR, 'schedule_configs.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(filePath: string, data: T): void {
  ensureDataDir()
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// ─────────────────────────────────────────────
// キュー操作
// ─────────────────────────────────────────────
export const QueueStore = {
  getAll(): ScheduledPost[] {
    return readJson<ScheduledPost[]>(QUEUE_FILE, [])
  },

  getById(id: string): ScheduledPost | null {
    return this.getAll().find(p => p.id === id) ?? null
  },

  getByCastId(castId: string): ScheduledPost[] {
    return this.getAll().filter(p => p.cast_id === castId)
  },

  getPending(beforeTime?: string): ScheduledPost[] {
    const all = this.getAll()
    const cutoff = beforeTime ?? new Date().toISOString()
    return all.filter(p => p.status === 'pending' && p.scheduled_at <= cutoff)
  },

  upsert(post: ScheduledPost): void {
    const all = this.getAll()
    const idx = all.findIndex(p => p.id === post.id)
    if (idx >= 0) all[idx] = post
    else all.push(post)
    writeJson(QUEUE_FILE, all)
  },

  upsertMany(posts: ScheduledPost[]): void {
    const all = this.getAll()
    for (const post of posts) {
      const idx = all.findIndex(p => p.id === post.id)
      if (idx >= 0) all[idx] = post
      else all.push(post)
    }
    writeJson(QUEUE_FILE, all)
  },

  updateStatus(id: string, updates: Partial<ScheduledPost>): void {
    const all = this.getAll()
    const idx = all.findIndex(p => p.id === id)
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() }
      writeJson(QUEUE_FILE, all)
    }
  },

  delete(id: string): void {
    const all = this.getAll().filter(p => p.id !== id)
    writeJson(QUEUE_FILE, all)
  },

  deleteByCastId(castId: string): void {
    const all = this.getAll().filter(p => p.cast_id !== castId)
    writeJson(QUEUE_FILE, all)
  },

  // 古い完了済みの投稿をクリーンアップ（7日以上前）
  cleanup(): number {
    const all = this.getAll()
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const filtered = all.filter(p =>
      p.status === 'pending' || p.status === 'processing' || p.updated_at > cutoff
    )
    writeJson(QUEUE_FILE, filtered)
    return all.length - filtered.length
  },
}

// ─────────────────────────────────────────────
// ログ操作
// ─────────────────────────────────────────────
export const LogStore = {
  getAll(): PostLog[] {
    return readJson<PostLog[]>(LOGS_FILE, [])
  },

  getByCastId(castId: string, limit = 50): PostLog[] {
    return this.getAll()
      .filter(l => l.cast_id === castId)
      .sort((a, b) => b.executed_at.localeCompare(a.executed_at))
      .slice(0, limit)
  },

  getRecent(limit = 100): PostLog[] {
    return this.getAll()
      .sort((a, b) => b.executed_at.localeCompare(a.executed_at))
      .slice(0, limit)
  },

  append(log: PostLog): void {
    const all = this.getAll()
    all.push(log)
    // 最大5000件保持
    const trimmed = all.slice(-5000)
    writeJson(LOGS_FILE, trimmed)
  },

  appendMany(logs: PostLog[]): void {
    const all = this.getAll()
    all.push(...logs)
    const trimmed = all.slice(-5000)
    writeJson(LOGS_FILE, trimmed)
  },
}

// ─────────────────────────────────────────────
// スケジュール設定操作
// ─────────────────────────────────────────────
export const ConfigStore = {
  getAll(): CastScheduleConfig[] {
    return readJson<CastScheduleConfig[]>(CONFIGS_FILE, [])
  },

  getByCastId(castId: string): CastScheduleConfig | null {
    return this.getAll().find(c => c.cast_id === castId) ?? null
  },

  upsert(config: CastScheduleConfig): void {
    const all = this.getAll()
    const idx = all.findIndex(c => c.cast_id === config.cast_id)
    if (idx >= 0) all[idx] = config
    else all.push(config)
    writeJson(CONFIGS_FILE, all)
  },
}
