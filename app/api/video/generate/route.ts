// =============================================================
// Hailuo 02（MiniMax）画像→動画生成
// 流れ: POST で生成タスク開始 → task_id 返却 → status エンドポイントでポーリング → file_id 入手 → 動画URL取得
// https://www.minimax.io/platform/document/api/video_generation
// =============================================================
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface GenerateBody {
  /** 元画像のURL（顔同一性維持の要） */
  imageUrl: string
  /** カメラワーク・モーションのプロンプト（日本語可） */
  prompt?: string
  /** モデル（既定: I2V-01-Director） */
  model?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateBody = await req.json()
    const { imageUrl, prompt, model } = body
    if (!imageUrl) return NextResponse.json({ error: 'imageUrl は必須です' }, { status: 400 })

    const apiKey = process.env.HAILUO_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'HAILUO_API_KEY が未設定です' }, { status: 500 })

    const useModel = model || process.env.HAILUO_MODEL || 'I2V-01-Director'

    const res = await fetch('https://api.minimaxi.chat/v1/video_generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: useModel,
        prompt: prompt || '柔らかい光、自然な笑顔、ゆっくりとカメラがズームイン',
        first_frame_image: imageUrl,
      }),
    })
    if (!res.ok) {
      const errBody = await res.text()
      return NextResponse.json({ error: `Hailuo API ${res.status}`, detail: errBody.slice(0, 500) }, { status: 502 })
    }
    const data = await res.json()
    if (!data.task_id) return NextResponse.json({ error: 'task_id が返却されませんでした', raw: data }, { status: 502 })

    return NextResponse.json({
      taskId: data.task_id,
      status: 'queued',
      message: 'ポーリングで /api/video/status?taskId=xxx を確認してください（通常2〜5分）',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'サーバーエラー'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
