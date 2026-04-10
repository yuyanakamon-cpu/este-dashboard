import fs from 'fs'
import path from 'path'
import type { Platform } from '@/lib/types'

export interface SnsConnectionStatus {
  connected: boolean
  username: string
  connected_at: string | null
}

export interface CastAuth {
  cast_id: string
  cast_number: number
  login_id: string
  password_hash: string
  password_plain: string       // 表示用（マスターのみ）
  is_setup_complete: boolean
  display_name: string
  sns_status: Record<Platform, SnsConnectionStatus>
  created_at: string
  last_login_at: string | null
}

const AUTH_FILE = path.join(process.cwd(), 'data', 'cast_auth.json')

function read(): Record<string, CastAuth> {
  try {
    if (!fs.existsSync(AUTH_FILE)) return {}
    return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'))
  } catch { return {} }
}

function write(data: Record<string, CastAuth>): void {
  const dir = path.dirname(AUTH_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export async function hashPassword(pw: string): Promise<string> {
  const buf = new TextEncoder().encode(pw)
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function makeCastId(): string {
  return `cast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function getNextNumber(all: Record<string, CastAuth>): number {
  const numbers = Object.values(all).map(a => a.cast_number ?? 0)
  return numbers.length === 0 ? 1 : Math.max(...numbers) + 1
}

function formatNumber(n: number): string {
  return String(n).padStart(5, '0')
}

function defaultSns(): Record<Platform, SnsConnectionStatus> {
  return {
    x:         { connected: false, username: '', connected_at: null },
    bluesky:   { connected: false, username: '', connected_at: null },
    threads:   { connected: false, username: '', connected_at: null },
    instagram: { connected: false, username: '', connected_at: null },
  }
}

export const CastAuthStore = {
  getAll(): CastAuth[] {
    return Object.values(read()).sort((a, b) => (a.cast_number ?? 0) - (b.cast_number ?? 0))
  },
  getByCastId(id: string): CastAuth | null { return read()[id] ?? null },
  getByLoginId(loginId: string): CastAuth | null {
    return Object.values(read()).find(a => a.login_id === loginId) ?? null
  },

  issueNew(): CastAuth {
    const all = read()
    const num = getNextNumber(all)
    const auth: CastAuth = {
      cast_id: makeCastId(),
      cast_number: num,
      login_id: formatNumber(num),
      password_hash: '',
      password_plain: '',
      is_setup_complete: false,
      display_name: '',
      sns_status: defaultSns(),
      created_at: new Date().toISOString(),
      last_login_at: null,
    }
    all[auth.cast_id] = auth
    write(all)
    return auth
  },

  reissueId(castId: string): CastAuth {
    const all = read()
    if (!all[castId]) throw new Error('キャストが見つかりません')
    all[castId].password_hash = ''
    all[castId].password_plain = ''
    all[castId].is_setup_complete = false
    write(all)
    return all[castId]
  },

  delete(castId: string): void {
    const all = read()
    delete all[castId]
    write(all)
  },

  async setupPassword(castId: string, password: string, displayName: string): Promise<void> {
    const all = read()
    if (!all[castId]) throw new Error('キャストが見つかりません')
    if (all[castId].is_setup_complete) throw new Error('既に設定済みです')
    all[castId].password_hash = await hashPassword(password)
    all[castId].password_plain = password
    all[castId].is_setup_complete = true
    all[castId].display_name = displayName.trim()
    write(all)
  },

  updateDisplayName(castId: string, displayName: string): void {
    const all = read()
    if (!all[castId]) throw new Error('キャストが見つかりません')
    all[castId].display_name = displayName.trim()
    write(all)
  },

  async resetPassword(castId: string, newPassword: string): Promise<void> {
    const all = read()
    if (!all[castId]) throw new Error('キャストが見つかりません')
    all[castId].password_hash = await hashPassword(newPassword)
    all[castId].password_plain = newPassword
    all[castId].is_setup_complete = true
    write(all)
  },

  async verify(loginId: string, password: string): Promise<CastAuth | null> {
    const auth = this.getByLoginId(loginId)
    if (!auth || !auth.is_setup_complete) return null
    const hash = await hashPassword(password)
    if (hash !== auth.password_hash) return null
    const all = read()
    all[auth.cast_id].last_login_at = new Date().toISOString()
    write(all)
    return all[auth.cast_id]
  },

  updateSns(castId: string, platform: Platform, status: Partial<SnsConnectionStatus>): void {
    const all = read()
    if (!all[castId]) throw new Error('キャストが見つかりません')
    all[castId].sns_status[platform] = {
      ...all[castId].sns_status[platform],
      ...status,
      connected_at: status.connected ? new Date().toISOString() : null,
    }
    write(all)
  },
}
