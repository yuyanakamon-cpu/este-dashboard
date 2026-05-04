import type { Platform } from '@/lib/types'
import type { PlatformResult } from '@/lib/scheduler/types'
import type { PlatformAdapter } from './adapter'
import { CHAR_LIMITS } from './adapter'

export class XAdapter implements PlatformAdapter {
  platform: Platform = 'x'

  constructor(
    private appKey: string,
    private appSecret: string,
    private accessToken: string,
    private accessSecret: string,
  ) {}

  validate(content: string): { valid: boolean; reason?: string } {
    if (!content || content.trim().length === 0) {
      return { valid: false, reason: '投稿テキストが空です' }
    }
    if (content.length > CHAR_LIMITS.x) {
      return { valid: false, reason: `文字数超過: ${content.length}文字（上限 ${CHAR_LIMITS.x}文字）` }
    }
    return { valid: true }
  }

  async post(content: string): Promise<PlatformResult> {
    const validation = this.validate(content)
    if (!validation.valid) {
      return { platform: 'x', status: 'failed', error: validation.reason }
    }

    try {
      const { TwitterApi } = await import('twitter-api-v2')
      const client = new TwitterApi({
        appKey: this.appKey,
        appSecret: this.appSecret,
        accessToken: this.accessToken,
        accessSecret: this.accessSecret,
      })
      const result = await client.v2.tweet(content)

      return {
        platform: 'x',
        status: 'sent',
        post_id: result.data.id,
        url: `https://x.com/i/web/status/${result.data.id}`,
        sent_at: new Date().toISOString(),
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'X投稿エラー'
      return { platform: 'x', status: 'failed', error: message }
    }
  }
}
