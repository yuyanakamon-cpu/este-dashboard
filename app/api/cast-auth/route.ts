import { NextRequest, NextResponse } from 'next/server'
import { CastAuthStore } from '@/lib/auth/cast-auth'
import type { Platform } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  try {
    switch (action) {

      case 'login': {
        const { login_id, password } = body
        if (!login_id || !password)
          return NextResponse.json({ error: 'IDとパスワードを入力してください' }, { status: 400 })
        const auth = await CastAuthStore.verify(login_id.trim(), password)
        if (!auth)
          return NextResponse.json({ error: 'IDまたはパスワードが違います' }, { status: 401 })
        return NextResponse.json({
          success: true,
          cast_id: auth.cast_id,
          display_name: auth.display_name,
          sns_status: auth.sns_status,
        })
      }

      case 'setup': {
        const { login_id, password, password_confirm, display_name } = body
        if (!login_id || !password)
          return NextResponse.json({ error: 'IDとパスワードを入力してください' }, { status: 400 })
        if (!display_name?.trim())
          return NextResponse.json({ error: '在籍名を入力してください' }, { status: 400 })
        if (password !== password_confirm)
          return NextResponse.json({ error: 'パスワードが一致しません' }, { status: 400 })
        if (password.length < 6)
          return NextResponse.json({ error: 'パスワードは6文字以上にしてください' }, { status: 400 })
        const auth = CastAuthStore.getByLoginId(login_id.trim())
        if (!auth)
          return NextResponse.json({ error: 'ログインIDが見つかりません' }, { status: 404 })
        if (auth.is_setup_complete)
          return NextResponse.json({ error: 'このIDは既に設定済みです。オーナーにIDの再発行を依頼してください' }, { status: 400 })
        await CastAuthStore.setupPassword(auth.cast_id, password, display_name)
        return NextResponse.json({ success: true, cast_id: auth.cast_id, display_name })
      }

      // IDが存在するか確認だけ（セットアップしない）
      case 'check_id': {
        const { login_id } = body
        const auth = CastAuthStore.getByLoginId(login_id?.trim())
        if (!auth) return NextResponse.json({ error: 'ログインIDが見つかりません' }, { status: 404 })
        if (auth.is_setup_complete) return NextResponse.json({ error: 'このIDは既に設定済みです。オーナーにIDの再発行を依頼してください' }, { status: 400 })
        return NextResponse.json({ success: true, cast_id: auth.cast_id })
      }

      // ワンクリックでID発行
      case 'issue_new': {
        const auth = CastAuthStore.issueNew()
        return NextResponse.json({ success: true, auth })
      }

      // ID再発行（番号はそのまま、PWのみリセット）
      case 'reissue_id': {
        const { cast_id } = body
        const auth = CastAuthStore.reissueId(cast_id)
        return NextResponse.json({ success: true, auth })
      }

      case 'delete': {
        const { cast_id } = body
        CastAuthStore.delete(cast_id)
        return NextResponse.json({ success: true })
      }

      case 'reset_password': {
        const { cast_id, new_password } = body
        if (!new_password || new_password.length < 6)
          return NextResponse.json({ error: 'パスワードは6文字以上にしてください' }, { status: 400 })
        await CastAuthStore.resetPassword(cast_id, new_password)
        return NextResponse.json({ success: true })
      }

      case 'update_display_name': {
        const { cast_id, display_name } = body
        if (!display_name?.trim())
          return NextResponse.json({ error: '名前を入力してください' }, { status: 400 })
        CastAuthStore.updateDisplayName(cast_id, display_name)
        return NextResponse.json({ success: true })
      }

      case 'get_all': {
        return NextResponse.json({ credentials: CastAuthStore.getAll() })
      }

      case 'update_sns': {
        const { cast_id, platform, connected, username } = body
        CastAuthStore.updateSns(cast_id, platform as Platform, { connected, username })
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: `不明なアクション: ${action}` }, { status: 400 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'エラーが発生しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
