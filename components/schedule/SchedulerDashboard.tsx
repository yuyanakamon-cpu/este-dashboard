'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ScheduledPost, PostLog } from '@/lib/scheduler/types'
import type { Platform, PostType } from '@/lib/types'
import { POST_TYPE_LABELS, POST_TYPE_COLORS } from '@/lib/mock-data'
import {
  Play, RefreshCw, Calendar, List, Activity,
  CheckCircle2, Clock, XCircle, SkipForward,
  Zap, Trash2, Send, AlertCircle, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

const PLATFORM_ICONS: Record<Platform, string> = {
  x: '𝕏', bluesky: '🦋', threads: '🧵', instagram: '📷',
}
const STATUS_MAP = {
  pending:    { label: '待機中', cls: 'bg-sky-50 text-sky-700',    icon: <Clock size={10} /> },
  processing: { label: '実行中', cls: 'bg-amber-50 text-amber-700', icon: <RefreshCw size={10} className="animate-spin" /> },
  sent:       { label: '完了',   cls: 'bg-green-50 text-green-700', icon: <CheckCircle2 size={10} /> },
  failed:     { label: '失敗',   cls: 'bg-red-50 text-red-700',     icon: <XCircle size={10} /> },
  cancelled:  { label: 'キャンセル', cls: 'bg-stone-50 text-stone-500', icon: <XCircle size={10} /> },
  skipped:    { label: 'スキップ',   cls: 'bg-stone-50 text-stone-400', icon: <SkipForward size={10} /> },
}

export default function SchedulerDashboard() {
  const [tab, setTab] = useState<'queue' | 'logs' | 'settings'>('queue')
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [logs, setLogs] = useState<PostLog[]>([])
  const [loading, setLoading] = useState(false)
  const [runLoading, setRunLoading] = useState(false)
  const [genLoading, setGenLoading] = useState(false)
  const [lastRun, setLastRun] = useState<{ sent: number; failed: number } | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/scheduler/queue')
      const data = await res.json()
      setPosts(data.posts ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    const res = await fetch('/api/scheduler/logs?limit=100')
    const data = await res.json()
    setLogs(data.logs ?? [])
  }, [])

  useEffect(() => {
    fetchQueue()
    fetchLogs()
  }, [fetchQueue, fetchLogs])

  // キューを手動実行
  const handleRun = async () => {
    setRunLoading(true)
    try {
      const res = await fetch('/api/scheduler/run', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setLastRun({ sent: data.result.sent, failed: data.result.failed })
        fetchQueue()
        fetchLogs()
      }
    } finally {
      setRunLoading(false)
    }
  }

  // 全キャストのスケジュールを生成
  const handleGenerateAll = async () => {
    setGenLoading(true)
    try {
      const res = await fetch('/api/scheduler/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_all', days: 7 }),
      })
      const data = await res.json()
      if (data.success) fetchQueue()
    } finally {
      setGenLoading(false)
    }
  }

  // 投稿をキャンセル
  const handleCancel = async (postId: string) => {
    await fetch('/api/scheduler/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', postId }),
    })
    fetchQueue()
  }

  // 今すぐ実行
  const handleRunNow = async (postId: string) => {
    await fetch('/api/scheduler/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'run_now', postId }),
    })
    fetchQueue()
    fetchLogs()
  }

  // 統計
  const pending  = posts.filter(p => p.status === 'pending').length
  const sent     = posts.filter(p => p.status === 'sent').length
  const failed   = posts.filter(p => p.status === 'failed').length
  const logSent  = logs.filter(l => l.status === 'sent').length
  const logFail  = logs.filter(l => l.status === 'failed').length

  const filteredPosts = filterStatus === 'all'
    ? posts
    : posts.filter(p => p.status === filterStatus)

  return (
    <div className="p-8 animate-fade-in">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">投稿スケジューラー</h1>
          <p className="text-sm text-stone-400 mt-1">自動投稿の管理・実行・ログ確認</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateAll}
            disabled={genLoading}
            className="flex items-center gap-1.5 text-xs bg-white border border-stone-200 text-stone-600 px-4 py-2 rounded-xl font-medium hover:bg-stone-50 transition-colors disabled:opacity-40"
          >
            <Calendar size={13} />
            {genLoading ? '生成中...' : '7日分を自動生成'}
          </button>
          <button
            onClick={handleRun}
            disabled={runLoading}
            className="flex items-center gap-1.5 text-xs bg-rose-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-40"
          >
            <Play size={13} />
            {runLoading ? '実行中...' : '今すぐ実行'}
          </button>
        </div>
      </div>

      {/* 実行結果 */}
      {lastRun && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
          <CheckCircle2 size={16} className="text-green-600 shrink-0" />
          <span className="text-sm text-green-700">
            実行完了：送信 <strong>{lastRun.sent}件</strong>
            {lastRun.failed > 0 && <span className="text-red-600 ml-2">/ 失敗 {lastRun.failed}件</span>}
          </span>
          <button onClick={() => setLastRun(null)} className="ml-auto text-green-400 hover:text-green-600">×</button>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <Kpi label="待機中" value={pending} color="sky" icon={<Clock size={14} className="text-sky-500" />} />
        <Kpi label="完了（キュー）" value={sent} color="green" icon={<CheckCircle2 size={14} className="text-green-500" />} />
        <Kpi label="失敗（キュー）" value={failed} color="red" icon={<XCircle size={14} className="text-red-500" />} />
        <Kpi label="送信済（ログ）" value={logSent} color="teal" icon={<Send size={14} className="text-teal-500" />} />
        <Kpi label="失敗（ログ）" value={logFail} color="amber" icon={<AlertCircle size={14} className="text-amber-500" />} />
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-6 bg-stone-100 p-1 rounded-xl w-fit">
        {([
          { id: 'queue', label: 'キュー管理', icon: <List size={13} /> },
          { id: 'logs',  label: '実行ログ',   icon: <Activity size={13} /> },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx('flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              tab === t.id ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700')}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── キュー管理 ── */}
      {tab === 'queue' && (
        <div className="animate-slide-up">
          {/* ステータスフィルタ */}
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {['all', 'pending', 'sent', 'failed', 'cancelled'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={clsx('text-xs px-3 py-1 rounded-lg border font-medium transition-all',
                  filterStatus === s
                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                    : 'border-stone-200 text-stone-400 hover:border-stone-300')}>
                {s === 'all' ? '全て' : STATUS_MAP[s as keyof typeof STATUS_MAP]?.label ?? s}
                {s === 'pending' && pending > 0 && (
                  <span className="ml-1.5 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pending}</span>
                )}
              </button>
            ))}
            <button onClick={fetchQueue} className="ml-auto text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1">
              <RefreshCw size={12} />更新
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-stone-400 text-sm">読み込み中...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Calendar size={32} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">スケジュールされた投稿がありません</div>
              <div className="text-xs mt-1 text-stone-300">「7日分を自動生成」ボタンで作成できます</div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
              <div className="grid grid-cols-[120px_100px_80px_1fr_140px_100px] text-[10px] font-medium text-stone-400 uppercase tracking-wider px-5 py-3 border-b border-stone-50 bg-stone-50">
                <div>日時</div>
                <div>キャスト</div>
                <div>種別</div>
                <div>テキスト</div>
                <div>媒体</div>
                <div>操作</div>
              </div>
              <div className="divide-y divide-stone-50 max-h-[600px] overflow-y-auto">
                {filteredPosts.map(post => (
                  <PostRow
                    key={post.id}
                    post={post}
                    onCancel={handleCancel}
                    onRunNow={handleRunNow}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 実行ログ ── */}
      {tab === 'logs' && (
        <div className="animate-slide-up">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Activity size={32} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">まだ実行ログがありません</div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
              <div className="grid grid-cols-[160px_80px_80px_1fr_80px] text-[10px] font-medium text-stone-400 uppercase tracking-wider px-5 py-3 border-b border-stone-50 bg-stone-50">
                <div>実行日時</div>
                <div>キャスト</div>
                <div>媒体</div>
                <div>テキスト</div>
                <div>結果</div>
              </div>
              <div className="divide-y divide-stone-50 max-h-[600px] overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className="grid grid-cols-[160px_80px_80px_1fr_80px] px-5 py-3 items-center hover:bg-stone-50 transition-colors">
                    <div className="text-xs font-mono text-stone-400">
                      {new Date(log.executed_at).toLocaleString('ja-JP', {
                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-stone-700">{log.cast_name}</div>
                    <div className="text-xs">{PLATFORM_ICONS[log.platform]}</div>
                    <div className="text-xs text-stone-500 truncate pr-4">{log.content.slice(0, 40)}...</div>
                    <div>
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-medium">
                          <CheckCircle2 size={10} />送信済
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-red-500 font-medium">
                          <XCircle size={10} />失敗
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 投稿行コンポーネント ──
function PostRow({ post, onCancel, onRunNow }: {
  post: ScheduledPost
  onCancel: (id: string) => void
  onRunNow: (id: string) => void
}) {
  const st = STATUS_MAP[post.status] ?? STATUS_MAP.pending
  const scheduledDate = new Date(post.scheduled_at)

  return (
    <div className="grid grid-cols-[120px_100px_80px_1fr_140px_100px] px-5 py-3 items-center hover:bg-stone-50 transition-colors">
      <div className="text-xs font-mono text-stone-500">
        <div>{scheduledDate.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}</div>
        <div className="text-stone-400">{scheduledDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div className="text-xs text-stone-700 font-medium">{post.cast_name}</div>
      <div>
        <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium', POST_TYPE_COLORS[post.post_type])}>
          {POST_TYPE_LABELS[post.post_type]}
        </span>
      </div>
      <div className="text-xs text-stone-500 truncate pr-4">
        {post.content ? post.content.slice(0, 45) + '...' : (
          <span className="text-stone-300 italic">テキスト未設定</span>
        )}
      </div>
      <div className="flex gap-1 flex-wrap">
        {post.platforms.map(p => (
          <span key={p} className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
            {PLATFORM_ICONS[p as Platform]}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className={clsx('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium', st.cls)}>
          {st.icon}{st.label}
        </span>
        {post.status === 'pending' && (
          <>
            <button
              onClick={() => onRunNow(post.id)}
              title="今すぐ送信"
              disabled={!post.content}
              className="text-stone-300 hover:text-green-600 transition-colors disabled:opacity-30"
            >
              <Zap size={12} />
            </button>
            <button
              onClick={() => onCancel(post.id)}
              title="キャンセル"
              className="text-stone-300 hover:text-red-400 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── KPIカード ──
function Kpi({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-stone-400">{label}</span>
        {icon}
      </div>
      <div className="text-xl font-semibold text-stone-800">{value}</div>
    </div>
  )
}
