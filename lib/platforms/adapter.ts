import type { Platform } from '@/lib/types'
import type { PlatformResult } from '@/lib/scheduler/types'

// ─────────────────────────────────────────────
// プラットフォームアダプター インターフェース
// 実API接続時はこのインターフェースを実装して差し替えるだけ
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
// ── MOCK アダプター群（APIなしで動作する）──
// 実際にはログ出力 + ランダムな成功/失敗シミュレーション
// ─────────────────────────────────────────────

class MockAdapter implements PlatformAdapter {
  constructor(
    public platform: Platform,
    private successRate = 0.95 // 95%成功率でシミュレート
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
    // 実際のAPIコールをシミュレート（100〜500ms の遅延）
    await new Promise(r => setTimeout(r, 100 + Math.random() * 400))

    // バリデーション
    const validation = this.validate(content)
    if (!validation.valid) {
      return {
        platform: this.platform,
        status: 'failed',
        error: validation.reason,
      }
    }

    // ランダムな成功/失敗
    if (Math.random() > this.successRate) {
      return {
        platform: this.platform,
        status: 'failed',
        error: `[Mock] ${this.platform} API 一時エラー（実際のAPI接続後に解消されます）`,
      }
    }

    // 成功
    const mockPostId = `mock_${this.platform}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const mockUrl = getMockUrl(this.platform, mockPostId)

    console.log(`[Mock ${this.platform}] Posted: "${content.slice(0, 50)}..."`)
    if (mediaUrl) console.log(`[Mock ${this.platform}] Media: ${mediaUrl}`)

    return {
      platform: this.platform,
      status: 'sent',
      post_id: mockPostId,
      url: mockUrl,
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
// アダプターレジストリ
// ここを切り替えるだけで Mock → Real に移行できる
// ─────────────────────────────────────────────
const ADAPTERS: Record<Platform, PlatformAdapter> = {
  x:         new MockAdapter('x'),
  bluesky:   new MockAdapter('bluesky'),
  threads:   new MockAdapter('threads'),
  instagram: new MockAdapter('instagram'),
}

export function getAdapter(platform: Platform): PlatformAdapter {
  return ADAPTERS[platform]
}

export function getAllAdapters(): Record<Platform, PlatformAdapter> {
  return ADAPTERS
}

// 実API接続時はここを差し替える
// ADAPTERS['x'] = new XAdapter(credentials)
