import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'issue_new': {
        const { data: existing } = await supabase
          .from('cast_auth')
          .select('cast_id')
          .order('cast_id', { ascending: false })
          .limit(1)
        
        const lastNum = existing?.[0]?.cast_id 
          ? parseInt(existing[0].cast_id.replace('cast-', '')) 
          : 0
        const newNum = lastNum + 1
        const cast_id = `cast-${String(newNum).padStart(5, '0')}`
        const login_id = String(newNum).padStart(5, '0')
        const temp_password = Math.random().toString(36).slice(-8)
        const password_hash = await bcrypt.hash(temp_password, 10)

        const { data, error } = await supabase
          .from('cast_auth')
          .insert({ cast_id, login_id, password_hash })
          .select()
          .single()

        if (error) throw error
        return NextResponse.json({ success: true, auth: { ...data, temp_password } })
      }

      case 'get_all': {
        const { data, error } = await supabase
          .from('cast_auth')
          .select('*')
          .order('cast_id')
        if (error) throw error
        return NextResponse.json({ credentials: data })
      }

      case 'check_id':
      case 'verify': {
        const { login_id, password } = body
        const { data, error } = await supabase
          .from('cast_auth')
          .select('*')
          .eq('login_id', login_id.trim())
          .single()
        if (error || !data) return NextResponse.json({ error: 'ログインIDが見つかりません' }, { status: 404 })
        if (data.is_setup_complete) return NextResponse.json({ error: 'このIDは既に設定済みです' }, { status: 400 })
        return NextResponse.json({ success: true, cast_id: data.cast_id })
      }

      case 'setup': {
        const { cast_id, display_name, password } = body
        const password_hash = await bcrypt.hash(password, 10)
        const { data, error } = await supabase
          .from('cast_auth')
          .update({ display_name, password_hash, is_setup_complete: true })
          .eq('cast_id', cast_id)
          .select()
          .single()
        if (error) throw error
        return NextResponse.json({ success: true, cast_id: data.cast_id, display_name: data.display_name })
      }

      case 'login': {
        const { login_id, password } = body
        const { data, error } = await supabase
          .from('cast_auth')
          .select('*')
          .eq('login_id', login_id.trim())
          .single()
        if (error || !data) return NextResponse.json({ error: '認証失敗' }, { status: 401 })
        if (!data.is_setup_complete) return NextResponse.json({ error: 'まだセットアップが完了していません' }, { status: 401 })
        const valid = await bcrypt.compare(password, data.password_hash)
        if (!valid) return NextResponse.json({ error: 'パスワードが違います' }, { status: 401 })
        return NextResponse.json({ success: true, auth: data })
      }

      case 'reissue_id': {
        const { cast_id } = body
        const temp_password = Math.random().toString(36).slice(-8)
        const password_hash = await bcrypt.hash(temp_password, 10)
        const { data, error } = await supabase
          .from('cast_auth')
          .update({ password_hash, is_setup_complete: false })
          .eq('cast_id', cast_id)
          .select()
          .single()
        if (error) throw error
        return NextResponse.json({ success: true, auth: { ...data, temp_password } })
      }

      case 'update_display_name': {
        const { cast_id, display_name } = body
        const { error } = await supabase
          .from('cast_auth')
          .update({ display_name })
          .eq('cast_id', cast_id)
        if (error) throw error
        return NextResponse.json({ success: true })
      }

      case 'update_sns': {
        const { cast_id, platform, connected, username } = body
        // Fetch current sns_status to merge (ignore fetch error — treat as empty)
        const { data: current } = await supabase
          .from('cast_auth')
          .select('sns_status')
          .eq('cast_id', cast_id)
          .single()
        const sns_status = {
          ...(current?.sns_status ?? {}),
          [platform]: { connected, username, connected_at: connected ? new Date().toISOString() : null },
        }
        const { error } = await supabase
          .from('cast_auth')
          .update({ sns_status })
          .eq('cast_id', cast_id)
        if (error) throw error
        return NextResponse.json({ success: true })
      }

      case 'delete': {
        const { cast_id } = body
        const { error } = await supabase.from('cast_auth').delete().eq('cast_id', cast_id)
        if (error) throw error
        return NextResponse.json({ success: true })
      }

      case 'reset_password': {
        const { cast_id, new_password } = body
        if (!new_password || new_password.length < 6)
          return NextResponse.json({ error: 'パスワードは6文字以上' }, { status: 400 })
        const password_hash = await bcrypt.hash(new_password, 10)
        const { error } = await supabase.from('cast_auth').update({ password_hash }).eq('cast_id', cast_id)
        if (error) throw error
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: '不明なアクション' }, { status: 400 })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'エラーが発生しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
