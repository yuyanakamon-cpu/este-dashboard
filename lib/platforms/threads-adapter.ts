import type { Platform } from '@/lib/types'
import type { PlatformResult } from '@/lib/scheduler/types'
import type { PlatformAdapter } from './adapter'
import { CHAR_LIMITS } from './adapter'

// Threads API (Meta) — テキスト投稿
// Threads API は Instagram Graph API の一部として提供される
// https://developers.facebook.com/docs/threads
export class ThreadsAdapter implements PlatformAdapter {
  platform: Platform = 'threads'
  private static readonly BASE = 'https://graph.threads.net/v1.0'

  constructor(
    private accessToken: string,
    private threadsUserId: string,
  ) {}

  validate(content: string): { valid: boolean; reason?: string } {
    if (!content || content.trim().length === 0) {
      return { valid: false, reason: '投稿テキストが空です' }
    }
    if (content.length > CHAR_LIMITS.threads) {
      return { valid: false, reason: `文字数超過: ${content.length}文字（上限 ${CHAR_LIMITS.threads}文字）` }
    }
    return { valid: true }
  }

  async post(content: string): Promise<PlatformResult> {
    const validation = this.validate(content)
    if (!validation.valid) {
      return { platform: 'threads', status: 'failed', error: validation.reason }
    }

    try {
      // Step 1: Threadsコンテナ作成
      const containerRes = await fetch(
        `${ThreadsAdapter.BASE}/${this.threadsUserId}/threads`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_type: 'TEXT',
            text: content,
            access_token: this.accessToken,
          }),
        }
      )
      const containerData = await containerRes.json()

      if (!containerRes.ok || !containerData.id) {
        throw new Error(containerData.error?.message ?? 'Threadsコンテナ作成失敗')
      }

      // Step 2: 公開
      const publishRes = await fetch(
        `${ThreadsAdapter.BASE}/${this.threadsUserId}/threads_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerData.id,
            access_token: this.accessToken,
          }),
        }
      )
      const publishData = await publishRes.json()

      if (!publishRes.ok || !publishData.id) {
        throw new Error(publishData.error?.message ?? 'Threads公開失敗')
      }

      return {
        platform: 'threads',
        status: 'sent',
        post_id: publishData.id,
        url: `https://www.threads.net/t/${publishData.id}`,
        sent_at: new Date().toISOString(),
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Threads投稿エラー'
      return { platform: 'threads', status: 'failed', error: message }
    }
  }
}
