import type { Platform } from '@/lib/types'
import type { PlatformResult } from '@/lib/scheduler/types'
import type { PlatformAdapter } from './adapter'
import { CHAR_LIMITS } from './adapter'

// Instagram Graph API — テキスト投稿（キャプション付き画像 or テキストのみ）
// テキストのみ投稿は「REELS」「IMAGE」ではなくThreads側推奨だが、
// ここでは画像なしでも動作するようにコンテナ作成 → 公開フローを実装
export class InstagramAdapter implements PlatformAdapter {
  platform: Platform = 'instagram'
  private static readonly BASE = 'https://graph.instagram.com/v21.0'

  constructor(
    private accessToken: string,
    private igUserId: string,
  ) {}

  validate(content: string): { valid: boolean; reason?: string } {
    if (!content || content.trim().length === 0) {
      return { valid: false, reason: '投稿テキストが空です' }
    }
    if (content.length > CHAR_LIMITS.instagram) {
      return { valid: false, reason: `文字数超過: ${content.length}文字（上限 ${CHAR_LIMITS.instagram}文字）` }
    }
    return { valid: true }
  }

  async post(content: string, mediaUrl?: string): Promise<PlatformResult> {
    const validation = this.validate(content)
    if (!validation.valid) {
      return { platform: 'instagram', status: 'failed', error: validation.reason }
    }

    try {
      // Step 1: メディアコンテナ作成
      const containerParams = new URLSearchParams({
        access_token: this.accessToken,
        caption: content,
        ...(mediaUrl
          ? { image_url: mediaUrl, media_type: 'IMAGE' }
          : { media_type: 'IMAGE', image_url: 'https://via.placeholder.com/1080x1080.jpg' }),
      })

      const containerRes = await fetch(
        `${InstagramAdapter.BASE}/${this.igUserId}/media`,
        { method: 'POST', body: containerParams }
      )
      const containerData = await containerRes.json()

      if (!containerRes.ok || !containerData.id) {
        throw new Error(containerData.error?.message ?? 'メディアコンテナ作成失敗')
      }

      // Step 2: コンテナを公開
      const publishParams = new URLSearchParams({
        access_token: this.accessToken,
        creation_id: containerData.id,
      })

      const publishRes = await fetch(
        `${InstagramAdapter.BASE}/${this.igUserId}/media_publish`,
        { method: 'POST', body: publishParams }
      )
      const publishData = await publishRes.json()

      if (!publishRes.ok || !publishData.id) {
        throw new Error(publishData.error?.message ?? 'Instagram公開失敗')
      }

      return {
        platform: 'instagram',
        status: 'sent',
        post_id: publishData.id,
        url: `https://www.instagram.com/p/${publishData.id}/`,
        sent_at: new Date().toISOString(),
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Instagram投稿エラー'
      return { platform: 'instagram', status: 'failed', error: message }
    }
  }
}
