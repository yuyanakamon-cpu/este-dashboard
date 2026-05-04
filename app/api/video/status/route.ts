// =============================================================
// Hailuo 02 動画生成タスクの状態取得
// GET /api/video/status?taskId=xxx
// =============================================================
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const taskId = req.nextUrl.searchParams.get('taskId')
    if (!taskId) return NextResponse.json({ error: 'taskId は必須です' }, { status: 400 })

    const apiKey = process.env.HAILUO_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'HAILUO_API_KEY が未設定です' }, { status: 500 })

    // タスク状態クエリ
    const queryRes = await fetch(`https://api.minimaxi.chat/v1/query/video_generation?task_id=${encodeURIComponent(taskId)}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    if (!queryRes.ok) {
      const errBody = await queryRes.text()
      return NextResponse.json({ error: `Hailuo API ${queryRes.status}`, detail: errBody.slice(0, 500) }, { status: 502 })
    }
    const queryData = await queryRes.json()
    // status: 'Queueing' | 'Preparing' | 'Processing' | 'Success' | 'Fail'
    const status = queryData.status as string

    if (status !== 'Success') {
      return NextResponse.json({ taskId, status, raw: queryData })
    }

    // 成功時: file_id から動画URLを取得
    const fileId = queryData.file_id
    if (!fileId) return NextResponse.json({ taskId, status, error: 'file_id が見つかりません' })

    const fileRes = await fetch(`https://api.minimaxi.chat/v1/files/retrieve?file_id=${encodeURIComponent(fileId)}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const fileData = await fileRes.json()
    const videoUrl = fileData?.file?.download_url

    return NextResponse.json({
      taskId,
      status: 'success',
      videoUrl,
      fileId,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'サーバーエラー'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
