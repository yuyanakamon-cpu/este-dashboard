import type { Platform } from '@/lib/types'
import type { PlatformResult } from '@/lib/scheduler/types'
import type { PlatformAdapter } from './adapter'
import { CHAR_LIMITS } from './adapter'

export class BlueskyAdapter implements PlatformAdapter {
  platform: Platform = 'bluesky'
  private identifier: string
  private appPassword: string

  constructor(identifier: string, appPassword: string) {
    this.identifier = identifier
    this.appPassword = appPassword
  }

  validate(content: string): { valid: boolean; reason?: string } {
    if (!content || content.trim().length === 0) {
      return { valid: false, reason: '投稿テキストが空です' }
    }
    if (content.length > CHAR_LIMITS.bluesky) {
      return { valid: false, reason: `文字数超過: ${content.length}文字（上限 ${CHAR_LIMITS.bluesky}文字）` }
    }
    return { valid: true }
  }

  async post(content: string): Promise<PlatformResult> {
    const validation = this.validate(content)
    if (!validation.valid) {
      return { platform: 'bluesky', status: 'failed', error: validation.reason }
    }

    try {
      // Dynamic import to avoid issues in environments without the package
      const { BskyAgent } = await import('@atproto/api')
      const agent = new BskyAgent({ service: 'https://bsky.social' })
      await agent.login({ identifier: this.identifier, password: this.appPassword })
      const response = await agent.post({ text: content })

      return {
        platform: 'bluesky',
        status: 'sent',
        post_id: response.uri,
        url: `https://bsky.app/profile/${this.identifier}/post/${response.uri.split('/').pop()}`,
        sent_at: new Date().toISOString(),
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bluesky投稿エラー'
      return { platform: 'bluesky', status: 'failed', error: message }
    }
  }
}
