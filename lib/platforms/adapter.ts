import type { Platform } from '@/lib/types'
import type { PlatformResult } from '@/lib/scheduler/types'

// ─────────────────────────────────────────────
// プラットフォームアダプター インターフェース
// ─────────────────────────────────────────────
export interface PlatformAdapter {
  platform: Platform
  post(content: string, mediaUrl?: string): Promise<PlatformResult>
  validate(content: string): { valid: boolean; reason?: string }
}

// ─────────────────────────────────────────────
// 文字数制限
// ─────────────────────────────────────────────
export const CHAR_LIMITS: Record<Platform, number> = {
  x:         280,
  bluesky:   300,
  threads:   500,
  instagram: 2200,
}

// ─────────────────────────────────────────────
// キャスト固有のSNS認証情報型
// ─────────────────────────────────────────────
export interface SnsCredentials {
  bluesky?: { identifier: string; appPassword: string }
  x?: { appKey: string; appSecret: string; accessToken: string; accessSecret: string }
  instagram?: { accessToken: string; igUserId: string }
  threads?: { accessToken: string; threadsUserId: string }
}

// ─────────────────────────────────────────────
// MOCK アダプター（APIなしで動作するシミュレーション）
// ─────────────────────────────────────────────
class MockAdapter implements PlatformAdapter {
  constructor(
    public platform: Platform,
    private successRate = 0.95
  ) {}

  validate(content: string): { valid: boolean; reason?: string } {
    if (!content || content.trim().length === 0) {
      return { valid: false, reason: '投稿テキストが空です' }
    }
    const limit = CHAR_LIMITS[this.platform]
    if (content.length > limit) {
      return { valid: false, reason: `文字数超過: ${content.length}文字（上限 ${limit}文字）` }
    }
    return { valid: true }
  }

  async post(content: string, mediaUrl?: string): Promise<PlatformResult> {
    await new Promise(r => setTimeout(r, 100 + Math.random() * 400))

    const validation = this.validate(content)
    if (!validation.valid) {
      return { platform: this.platform, status: 'failed', error: validation.reason }
    }

    if (Math.random() > this.successRate) {
      return {
        platform: this.platform,
        status: 'failed',
        error: `[Mock] ${this.platform} API 一時エラー（実際のAPI接続後に解消されます）`,
      }
    }

    const mockPostId = `mock_${this.platform}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    console.log(`[Mock ${this.platform}] Posted: "${content.slice(0, 50)}..."`)
    if (mediaUrl) console.log(`[Mock ${this.platform}] Media: ${mediaUrl}`)

    return {
      platform: this.platform,
      status: 'sent',
      post_id: mockPostId,
      url: getMockUrl(this.platform, mockPostId),
      sent_at: new Date().toISOString(),
    }
  }
}

function getMockUrl(platform: Platform, postId: string): string {
  const urls: Record<Platform, string> = {
    x:         `https://x.com/user/status/${postId}`,
    bluesky:   `https://bsky.app/profile/user/post/${postId}`,
    threads:   `https://www.threads.net/t/${postId}`,
    instagram: `https://www.instagram.com/p/${postId}/`,
  }
  return urls[platform]
}

// ─────────────────────────────────────────────
// グローバルアダプター（環境変数ベース）
// ─────────────────────────────────────────────
function buildAdapters(): Record<Platform, PlatformAdapter> {
  const adapters: Record<Platform, PlatformAdapter> = {
    x:         new MockAdapter('x'),
    bluesky:   new MockAdapter('bluesky'),
    threads:   new MockAdapter('threads'),
    instagram: new MockAdapter('instagram'),
  }

  // Bluesky
  if (process.env.BLUESKY_IDENTIFIER && process.env.BLUESKY_APP_PASSWORD) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BlueskyAdapter } = require('./bluesky-adapter')
    adapters.bluesky = new BlueskyAdapter(
      process.env.BLUESKY_IDENTIFIER,
      process.env.BLUESKY_APP_PASSWORD,
    )
  }

  // X
  if (
    process.env.X_APP_KEY && process.env.X_APP_SECRET &&
    process.env.X_ACCESS_TOKEN && process.env.X_ACCESS_SECRET
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { XAdapter } = require('./x-adapter')
    adapters.x = new XAdapter(
      process.env.X_APP_KEY,
      process.env.X_APP_SECRET,
      process.env.X_ACCESS_TOKEN,
      process.env.X_ACCESS_SECRET,
    )
  }

  // Instagram
  if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { InstagramAdapter } = require('./instagram-adapter')
    adapters.instagram = new InstagramAdapter(
      process.env.INSTAGRAM_ACCESS_TOKEN,
      process.env.INSTAGRAM_USER_ID,
    )
  }

  // Threads
  if (process.env.THREADS_ACCESS_TOKEN && process.env.THREADS_USER_ID) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ThreadsAdapter } = require('./threads-adapter')
    adapters.threads = new ThreadsAdapter(
      process.env.THREADS_ACCESS_TOKEN,
      process.env.THREADS_USER_ID,
    )
  }

  return adapters
}

const ADAPTERS: Record<Platform, PlatformAdapter> = buildAdapters()

export function getAdapter(platform: Platform): PlatformAdapter {
  return ADAPTERS[platform]
}

// ─────────────────────────────────────────────
// キャスト固有の認証情報でアダプターを取得
// ─────────────────────────────────────────────
export function getAdapterWithCredentials(
  platform: Platform,
  credentials?: SnsCredentials,
): PlatformAdapter {
  if (!credentials) return ADAPTERS[platform]

  switch (platform) {
    case 'bluesky': {
      const c = credentials.bluesky
      if (c?.identifier && c?.appPassword) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { BlueskyAdapter } = require('./bluesky-adapter')
        return new BlueskyAdapter(c.identifier, c.appPassword)
      }
      break
    }
    case 'x': {
      const c = credentials.x
      if (c?.appKey && c?.appSecret && c?.accessToken && c?.accessSecret) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { XAdapter } = require('./x-adapter')
        return new XAdapter(c.appKey, c.appSecret, c.accessToken, c.accessSecret)
      }
      break
    }
    case 'instagram': {
      const c = credentials.instagram
      if (c?.accessToken && c?.igUserId) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { InstagramAdapter } = require('./instagram-adapter')
        return new InstagramAdapter(c.accessToken, c.igUserId)
      }
      break
    }
    case 'threads': {
      const c = credentials.threads
      if (c?.accessToken && c?.threadsUserId) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { ThreadsAdapter } = require('./threads-adapter')
        return new ThreadsAdapter(c.accessToken, c.threadsUserId)
      }
      break
    }
  }

  return ADAPTERS[platform]
}

export function getAllAdapters(): Record<Platform, PlatformAdapter> {
  return ADAPTERS
}
