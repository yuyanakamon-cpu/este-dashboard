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
  /** 'claude' | 'gemini'（省略時は AI_PROVIDER 環境変数 → デフォルト 'claude'） */
  provider?: 'claude' | 'gemini'
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateBody = await req.json()
    const { cast, postType, platforms, customNote, writingStyle, variations, provider: providerOverride } = body

    if (!cast || !postType || !platforms?.length) {
      return NextResponse.json({ error: 'cast, postType, platforms は必須です' }, { status: 400 })
    }

    const provider = providerOverride || (process.env.AI_PROVIDER as 'claude' | 'gemini' | undefined) || 'claude'
    const requestPayload = { cast, postType, platforms, customNote, writingStyle }
    const system = buildSystemPrompt()

    const generate = async (userPrompt: string): Promise<string> => {
      try {
        return await callProvider(provider, system, userPrompt)
      } catch (err) {
        // 失敗時は別プロバイダーへフォールバック
        const fallback = provider === 'claude' ? 'gemini' : 'claude'
        console.warn(`[/api/generate] ${provider} 失敗 → ${fallback} にフォールバック`, err instanceof Error ? err.message : err)
        return await callProvider(fallback, system, userPrompt)
      }
    }

    if (variations) {
      const results = await Promise.all([0, 1, 2].map(i => generate(buildVariationPrompt(requestPayload, i))))
      return NextResponse.json({ texts: results, provider })
    } else {
      const text = await generate(buildUserPrompt(requestPayload))
      return NextResponse.json({ text, provider })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'サーバーエラーが発生しました'
    console.error('[/api/generate] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// =============================================================
// Provider Router
// =============================================================
async function callProvider(provider: 'claude' | 'gemini', system: string, userPrompt: string): Promise<string> {
  if (provider === 'gemini') {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY が設定されていません')
    return callGemini(key, system, userPrompt)
  }
  // claude（デフォルト）
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY が設定されていません')
  return callClaude(key, system, userPrompt)
}

// =============================================================
// Claude Haiku 4.5（コスパ最強・日本語最適）
// =============================================================
async function callClaude(apiKey: string, system: string, userPrompt: string): Promise<string> {
  const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001'
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Claude API error ${res.status}: ${errBody.slice(0, 300)}`)
  }
  const data = await res.json()
  const content = data.content?.[0]
  if (content?.type === 'text') return content.text.trim()
  throw new Error('Claude API: 予期しないレスポンス形式')
}

// =============================================================
// Google Gemini 2.5 Flash（無料枠厚め・サブ）
// =============================================================
async function callGemini(apiKey: string, system: string, userPrompt: string): Promise<string> {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.9,
      },
    }),
  })
  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${errBody.slice(0, 300)}`)
  }
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text === 'string' && text.trim().length > 0) return text.trim()
  throw new Error('Gemini API: 予期しないレスポンス形式')
}
