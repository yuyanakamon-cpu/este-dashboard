import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt, buildUserPrompt, buildVariationPrompt } from '@/lib/ai/prompts'
import type { Cast, PostType, Platform } from '@/lib/types'
import type { WritingStyle } from '@/lib/ai/prompts'

export const runtime = 'nodejs'

interface GenerateBody {
  cast: Cast
  postType: PostType
  platforms: Platform[]
  customNote?: string
  writingStyle?: WritingStyle
  variations?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateBody = await req.json()
    const { cast, postType, platforms, customNote, writingStyle, variations } = body

    if (!cast || !postType || !platforms?.length) {
      return NextResponse.json({ error: 'cast, postType, platforms は必須です' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY が設定されていません。.env.local を確認してください。' },
        { status: 500 }
      )
    }

    const request = { cast, postType, platforms, customNote, writingStyle }

    if (variations) {
      const results = await Promise.all(
        [0, 1, 2].map(i => callClaude(apiKey, buildSystemPrompt(), buildVariationPrompt(request, i)))
      )
      return NextResponse.json({ texts: results })
    } else {
      const text = await callClaude(apiKey, buildSystemPrompt(), buildUserPrompt(request))
      return NextResponse.json({ text })
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'サーバーエラーが発生しました'
    console.error('[/api/generate] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function callClaude(apiKey: string, system: string, userPrompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Claude API error ${res.status}: ${errBody}`)
  }

  const data = await res.json()
  const content = data.content?.[0]
  if (content?.type === 'text') return content.text.trim()
  throw new Error('Claude API から予期しないレスポンス形式が返りました')
}
