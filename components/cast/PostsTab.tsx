'use client'

import { useState } from 'react'
import type { Cast, Platform, PostType } from '@/lib/types'
import type { WritingStyle } from '@/lib/ai/prompts'
import { WRITING_STYLE_LABELS } from '@/lib/ai/prompts'
import { POST_TYPE_LABELS, POST_TYPE_COLORS, PLATFORM_LABELS } from '@/lib/mock-data'
import { useGenerate } from '@/lib/ai/useGenerate'
import {
  Send, Sparkles, Edit3, CheckCircle2, Clock,
  FileText, AlertCircle, RefreshCw, Copy, ChevronDown, ChevronUp, Loader2, CalendarClock
} from 'lucide-react'
import clsx from 'clsx'

const PLATFORMS: Platform[] = ['x', 'bluesky', 'threads', 'instagram']
const PLATFORM_ICONS: Record<Platform, string> = {
  x: '𝕏', bluesky: '🦋', threads: '🧵', instagram: '📷',
}

const POST_TYPES: PostType[] = ['shift_announce', 'vacancy', 'personality', 'media']

const POST_TYPE_META: Record<PostType, { desc: string; icon: string }> = {
  shift_announce: { icon: '🌸', desc: '出勤時間・来てほしい気持ちを伝える' },
  vacancy:        { icon: '⚡', desc: '空き枠を告知して即予約を促す' },
  personality:    { icon: '💬', desc: '人柄・日常でファンを育てる' },
  media:          { icon: '📸', desc: '写真・動画に合わせたキャプション' },
}

const STYLE_KEYS = Object.keys(WRITING_STYLE_LABELS) as WritingStyle[]

interface PostsTabProps {
  cast: Cast
}

export default function PostsTab({ cast }: PostsTabProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['x', 'bluesky'])
  const [postContent, setPostContent] = useState('')
  const [customNote, setCustomNote] = useState('')
  const [showCustomNote, setShowCustomNote] = useState(false)
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [mode, setMode] = useState<'single' | 'variations'>('single')
  const [writingStyle, setWritingStyle] = useState<WritingStyle>('natural')
  const [isPosting, setIsPosting] = useState(false)
  const [postResult, setPostResult] = useState<{ success: boolean; message: string } | null>(null)
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now')
  const [scheduledAt, setScheduledAt] = useState('')

  const { text, texts, isLoading, error, generate, generateVariations, clear } = useGenerate({
    cast,
    platforms: selectedPlatforms,
  })

  const handleGenerate = async (type: PostType) => {
    clear()
    setPostContent('')
    setSelectedVariation(null)
    setMode('single')
    const result = await generate(type, customNote || undefined, writingStyle)
    if (result) setPostContent(result)
  }

  const handleGenerateVariations = async (type: PostType) => {
    clear()
    setPostContent('')
    setSelectedVariation(null)
    setMode('variations')
    await generateVariations(type, customNote || undefined)
  }

  const selectVariation = (idx: number, t: string) => {
    setSelectedVariation(idx)
    setPostContent(t)
  }

  const handleCopy = async (t: string, idx: number) => {
    await navigator.clipboard.writeText(t)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const handlePost = async () => {
    if (!postContent.trim() || selectedPlatforms.length === 0) return
    setIsPosting(true)
    setPostResult(null)
    try {
      const action = scheduleMode === 'schedule' && scheduledAt ? 'add' : 'immediate'
      const body: Record<string, unknown> = {
        action,
        castId: cast.id,
        castName: cast.display_name,
        platforms: selectedPlatforms,
        postType: 'personality',
        content: postContent,
      }
      if (action === 'add') {
        body.scheduledAt = new Date(scheduledAt).toISOString()
      }

      const res = await fetch('/api/scheduler/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (action === 'immediate') {
        const sentPlatforms = (data.results ?? []).filter((r: { status: string }) => r.status === 'sent').map((r: { platform: string }) => r.platform)
        const failedPlatforms = (data.results ?? []).filter((r: { status: string }) => r.status === 'failed').map((r: { platform: string; error?: string }) => r)
        if (data.success || sentPlatforms.length > 0) {
          setPostResult({ success: true, message: `投稿完了: ${sentPlatforms.join(', ')}${failedPlatforms.length ? `（失敗: ${failedPlatforms.map((r: { platform: string }) => r.platform).join(', ')}）` : ''}` })
          setPostContent('')
          clear()
        } else {
          const errMsg = failedPlatforms[0]?.error ?? data.error ?? '投稿に失敗しました'
          setPostResult({ success: false, message: errMsg })
        }
      } else {
        if (data.success || data.post) {
          const dt = new Date(scheduledAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          setPostResult({ success: true, message: `${dt} に予約しました` })
          setPostContent('')
          setScheduledAt('')
          clear()
        } else {
          setPostResult({ success: false, message: data.error ?? '予約に失敗しました' })
        }
      }
    } catch {
      setPostResult({ success: false, message: 'ネットワークエラーが発生しました' })
    } finally {
      setIsPosting(false)
    }
  }

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  return (
    <div className="space-y-5 animate-slide-up">

      {/* AI生成パネル */}
      <div className="bg-white rounded-2xl border border-stone-100">
        <div className="flex items-center justify-between px-4 md:px-6 pt-4 md:pt-5 pb-3 md:pb-4 border-b border-stone-50">
          <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
            <Sparkles size={15} className="text-rose-500" />
            AI投稿テキスト生成
          </h3>
          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg">
            <button
              onClick={() => setMode('single')}
              className={clsx('text-xs px-3 py-1 rounded-md font-medium transition-all',
                mode === 'single' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500')}
            >1案</button>
            <button
              onClick={() => setMode('variations')}
              className={clsx('text-xs px-3 py-1 rounded-md font-medium transition-all',
                mode === 'variations' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500')}
            >3案比較</button>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-5">

          {/* プラットフォーム選択 */}
          <div>
            <div className="text-xs font-medium text-stone-500 mb-2">投稿先プラットフォーム</div>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(p => {
                const acc = cast.platforms[p]
                const selected = selectedPlatforms.includes(p)
                return (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    disabled={!acc.connected}
                    title={!acc.connected ? '未接続' : ''}
                    className={clsx(
                      'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium transition-all',
                      !acc.connected
                        ? 'border-stone-100 text-stone-300 cursor-not-allowed'
                        : selected
                          ? 'border-rose-300 bg-rose-50 text-rose-700'
                          : 'border-stone-200 text-stone-500 hover:border-stone-300'
                    )}
                  >
                    <span>{PLATFORM_ICONS[p]}</span>
                    <span>{PLATFORM_LABELS[p].split(' ').slice(-1)[0]}</span>
                    {!acc.connected && <span className="text-[9px]">未接続</span>}
                  </button>
                )
              })}
            </div>
            {selectedPlatforms.length === 0 && (
              <p className="text-xs text-amber-600 mt-1.5">投稿先を1つ以上選んでください</p>
            )}
          </div>

          {/* 文体スタイル選択 */}
          <div>
            <div className="text-xs font-medium text-stone-500 mb-2 flex items-center gap-1.5">
              文体スタイル
              <span className="text-[10px] text-stone-300 font-normal">（ベンチマーク7アカウント学習済み）</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {STYLE_KEYS.map(style => (
                <button
                  key={style}
                  onClick={() => setWritingStyle(style)}
                  className={clsx(
                    'text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all',
                    writingStyle === style
                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                      : 'border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-600'
                  )}
                >
                  {WRITING_STYLE_LABELS[style]}
                </button>
              ))}
            </div>
          </div>

          {/* 投稿の種類 */}
          <div>
            <div className="text-xs font-medium text-stone-500 mb-2">投稿の種類を選んで生成</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POST_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => mode === 'single' ? handleGenerate(type) : handleGenerateVariations(type)}
                  disabled={isLoading || selectedPlatforms.length === 0}
                  className={clsx(
                    'text-left px-4 py-3 rounded-xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                    POST_TYPE_COLORS[type],
                    'border-current border-opacity-20 hover:border-opacity-40 hover:shadow-sm active:scale-[0.98]'
                  )}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span>{POST_TYPE_META[type].icon}</span>
                    <span className="font-semibold text-xs">{POST_TYPE_LABELS[type]}</span>
                    {isLoading && <Loader2 size={11} className="animate-spin ml-auto" />}
                  </div>
                  <div className="text-[10px] opacity-70">{POST_TYPE_META[type].desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 追加指示（任意） */}
          <div>
            <button
              onClick={() => setShowCustomNote(!showCustomNote)}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              {showCustomNote ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              追加の指示を入れる（任意）
            </button>
            {showCustomNote && (
              <textarea
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                placeholder="例：「今日は空き枠が2つ」「夕方限定のサービスをアピール」「少し甘えたトーンで」など..."
                rows={2}
                className="mt-2 w-full text-xs border border-stone-200 rounded-xl p-3 resize-none focus:outline-none focus:border-rose-300 transition-colors text-stone-600 placeholder-stone-300"
              />
            )}
          </div>

          {/* エラー */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
              <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-medium text-red-700">生成エラー</div>
                <div className="text-xs text-red-600 mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {/* ローディング */}
          {isLoading && (
            <div className="flex items-center gap-3 py-4">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <span className="text-xs text-stone-500">
                {cast.name}らしい集客テキストを生成中...
              </span>
            </div>
          )}

          {/* 3案表示 */}
          {mode === 'variations' && texts.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-medium text-stone-500">3パターン生成完了（甘え系・強気かわいい系・ほのぼの日常系）</div>
              {texts.map((t, i) => (
                <div
                  key={i}
                  onClick={() => selectVariation(i, t)}
                  className={clsx(
                    'relative p-4 rounded-xl border-2 cursor-pointer transition-all',
                    selectedVariation === i
                      ? 'border-rose-400 bg-rose-50'
                      : 'border-stone-100 hover:border-stone-300 bg-white'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded',
                      ['bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700', 'bg-purple-100 text-purple-700'][i]
                    )}>
                      {['甘え系', '強気かわいい系', 'ほのぼの日常系'][i]}
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedVariation === i && (
                        <span className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
                          <CheckCircle2 size={10} />選択中
                        </span>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); handleCopy(t, i) }}
                        className="text-stone-300 hover:text-stone-500 transition-colors"
                      >
                        {copiedIdx === i ? <CheckCircle2 size={13} className="text-green-500" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 whitespace-pre-line leading-relaxed">{t}</p>
                  <div className="mt-2 text-[10px] text-stone-400">{t.length}文字</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 投稿エディタ */}
      <div className="bg-white rounded-2xl border border-stone-100 p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-stone-700">投稿エディタ</h3>
          {postContent && (
            <button
              onClick={() => { setPostContent(''); setPostResult(null); clear() }}
              className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={11} />クリア
            </button>
          )}
        </div>

        <textarea
          value={postContent}
          onChange={e => setPostContent(e.target.value)}
          placeholder="AI生成ボタンを押すか、直接テキストを入力してください..."
          rows={6}
          className="w-full text-sm border border-stone-200 rounded-xl p-4 resize-none focus:outline-none focus:border-rose-300 transition-colors text-stone-700 placeholder-stone-300 leading-relaxed"
        />

        {/* 文字数 */}
        <div className="flex items-center gap-3 mt-2">
          <span className={clsx('text-xs font-medium', postContent.length > 140 ? 'text-amber-600' : 'text-stone-400')}>
            {postContent.length}文字
          </span>
          {postContent.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {selectedPlatforms.map(p => {
                const limits: Record<Platform, number> = { x: 140, bluesky: 300, threads: 500, instagram: 2200 }
                const ok = postContent.length <= limits[p]
                return (
                  <span key={p} className={clsx('text-[10px] flex items-center gap-0.5', ok ? 'text-green-600' : 'text-red-500')}>
                    {PLATFORM_ICONS[p]}
                    {ok ? '✓' : `×(${limits[p]}字制限)`}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* 投稿結果トースト */}
        {postResult && (
          <div className={clsx(
            'mt-3 flex items-start gap-2 p-3 rounded-xl border text-xs',
            postResult.success
              ? 'bg-green-50 border-green-100 text-green-700'
              : 'bg-red-50 border-red-100 text-red-700'
          )}>
            {postResult.success
              ? <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
              : <AlertCircle size={13} className="shrink-0 mt-0.5" />}
            {postResult.message}
          </div>
        )}

        {/* 投稿モード切替 + アクションボタン */}
        <div className="mt-3 space-y-3">
          {/* モード切替タブ */}
          <div className="flex gap-1 bg-stone-100 p-0.5 rounded-xl w-fit">
            <button
              onClick={() => setScheduleMode('now')}
              className={clsx('text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5',
                scheduleMode === 'now' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500')}
            >
              <Send size={11} />今すぐ投稿
            </button>
            <button
              onClick={() => setScheduleMode('schedule')}
              className={clsx('text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5',
                scheduleMode === 'schedule' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500')}
            >
              <CalendarClock size={11} />予約投稿
            </button>
          </div>

          {/* 予約日時ピッカー */}
          {scheduleMode === 'schedule' && (
            <div>
              <label className="text-xs text-stone-500 mb-1 block">投稿日時</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                className="text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-300 transition-colors text-stone-700 w-full md:w-auto"
              />
            </div>
          )}

          {/* ボタン行 */}
          <div className="flex items-center justify-end gap-2">
            {postContent && (
              <button
                onClick={() => handleCopy(postContent, -1)}
                className="flex items-center gap-1.5 text-xs text-stone-500 border border-stone-200 px-3 py-1.5 rounded-xl hover:bg-stone-50 transition-all"
              >
                {copiedIdx === -1 ? <CheckCircle2 size={12} className="text-green-500" /> : <Copy size={12} />}
                コピー
              </button>
            )}
            <button
              onClick={handlePost}
              disabled={!postContent || selectedPlatforms.length === 0 || isPosting || (scheduleMode === 'schedule' && !scheduledAt)}
              className="flex items-center gap-2 text-sm bg-rose-500 text-white px-5 py-2 rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isPosting
                ? <Loader2 size={13} className="animate-spin" />
                : scheduleMode === 'schedule' ? <CalendarClock size={13} /> : <Send size={13} />}
              {isPosting ? '投稿中...' : scheduleMode === 'schedule' ? '予約する' : '今すぐ投稿'}
            </button>
          </div>
        </div>
      </div>

      {/* 投稿キュー */}
      <div>
        <h3 className="text-sm font-semibold text-stone-600 mb-3">本日の投稿キュー</h3>
        <div className="space-y-2">
          {cast.posts.map(post => (
            <div key={post.id} className="bg-white rounded-xl border border-stone-100 p-4 flex items-start gap-4">
              <div className="text-xs font-mono text-stone-400 w-12 shrink-0 pt-0.5">
                {new Date(post.scheduled_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium', POST_TYPE_COLORS[post.type])}>
                    {POST_TYPE_LABELS[post.type]}
                  </span>
                  {post.platforms.map(p => (
                    <span key={p} className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
                      {PLATFORM_ICONS[p as Platform]}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-stone-600 whitespace-pre-line line-clamp-3 leading-relaxed">{post.content}</p>
                {post.status === 'posted' && (
                  <div className="flex gap-4 mt-2">
                    <span className="text-[10px] text-stone-400">♥ {post.likes}</span>
                    <span className="text-[10px] text-stone-400">🔁 {post.reposts}</span>
                    <span className="text-[10px] text-stone-400">💬 {post.replies}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <PostStatusBadge status={post.status} />
                {post.status !== 'posted' && (
                  <button className="text-stone-300 hover:text-stone-500 transition-colors">
                    <Edit3 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PostStatusBadge({ status }: { status: string }) {
  const m: Record<string, [React.ReactNode, string, string]> = {
    posted:    [<CheckCircle2 key="p" size={10} />, '投稿済', 'text-green-600'],
    scheduled: [<Clock        key="s" size={10} />, '予定',   'text-sky-600'],
    draft:     [<FileText     key="d" size={10} />, '下書き', 'text-stone-500'],
    failed:    [<AlertCircle  key="f" size={10} />, '失敗',   'text-red-500'],
  }
  const [icon, label, cls] = m[status] || m['draft']
  return (
    <span className={clsx('inline-flex items-center gap-1 text-[10px] font-medium whitespace-nowrap', cls)}>
      {icon}{label}
    </span>
  )
}
