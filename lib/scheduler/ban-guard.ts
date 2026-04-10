// ═══════════════════════════════════════════════════════════════════
// BAN GUARD — Xアカウント凍結・シャドウバン回避システム
//
// 【リサーチ根拠】
// - Xは2026年現在Grok 4.1 Fastを導入し、文脈理解が大幅に向上
// - メンエスアカウントは通常アカウントより厳しく監視される
// - シャドウバンには4種類あり、それぞれ対策が異なる
//
// 【シャドウバン4種類と対策】
// 1. サーチサジェッションバン → キーワードスタッフィング禁止
// 2. サーチバン → スパム投稿パターン禁止
// 3. ゴーストバン → 自然なエンゲージメント維持
// 4. リプライデブースティング → 大量リプライ禁止
// ═══════════════════════════════════════════════════════════════════

import type { PostType } from '@/lib/types'

// ─────────────────────────────────────────────
// アカウント成長フェーズ
// ─────────────────────────────────────────────
export type GrowthPhase = 'warmup' | 'growth' | 'maintenance'

export interface PhaseConfig {
  daily_post_min: number
  daily_post_max: number
  min_interval_hours: number  // 投稿間の最小間隔
  max_interval_hours: number  // 投稿間の最大間隔
  description: string
}

const PHASE_CONFIGS: Record<GrowthPhase, PhaseConfig> = {
  // 新規・再開直後：超慎重モード（Bot判定を避けるため）
  warmup: {
    daily_post_min: 1,
    daily_post_max: 2,
    min_interval_hours: 6,
    max_interval_hours: 12,
    description: 'ウォームアップ期（1〜2週間）: 1日1〜2投稿で信頼スコアを構築',
  },
  // 成長期：徐々に増加
  growth: {
    daily_post_min: 2,
    daily_post_max: 4,
    min_interval_hours: 3,
    max_interval_hours: 7,
    description: '成長期（2〜4週間）: 徐々に投稿頻度を上げてエンゲージを積み上げる',
  },
  // 安定運用期：通常運用
  maintenance: {
    daily_post_min: 3,
    daily_post_max: 5,
    min_interval_hours: 2,
    max_interval_hours: 5,
    description: '安定運用期: 1日3〜5投稿。フォロワー数に合わせて最適化',
  },
}

// ─────────────────────────────────────────────
// 人間らしい活動時間帯（リサーチ結果）
// ─────────────────────────────────────────────
interface ActiveTimeSlot {
  hour_start: number
  hour_end: number
  weight: number       // 重み（高いほど優先）
  label: string
}

const ACTIVE_TIME_SLOTS: ActiveTimeSlot[] = [
  { hour_start: 7,  hour_end: 9,  weight: 2, label: '朝の活動時間' },
  { hour_start: 12, hour_end: 13, weight: 3, label: 'ランチタイム（最重要）' },
  { hour_start: 17, hour_end: 21, weight: 5, label: '仕事帰り（最重要 × 最高）' },
  { hour_start: 21, hour_end: 23, weight: 3, label: '夜の活動時間' },
  { hour_start: 0,  hour_end: 2,  weight: 1, label: '深夜帯（夜型ユーザー向け）' },
]

// ─────────────────────────────────────────────
// コンテンツ多様性の定義
// 雑談8割・お知らせ2割の法則に準拠
// ─────────────────────────────────────────────
export interface ContentTypeConfig {
  post_type: PostType
  weight: number          // 出現頻度のウェイト
  min_gap_posts: number   // 同じタイプを連続させない最小間隔（投稿数）
  risk_level: 'low' | 'medium' | 'high'
  x_algorithm_note: string
}

export const CONTENT_TYPE_CONFIGS: ContentTypeConfig[] = [
  {
    post_type: 'personality',
    weight: 40,            // 40%: 最も多く（雑談8割の核心）
    min_gap_posts: 2,
    risk_level: 'low',
    x_algorithm_note: '感情・体験・共感系はXアルゴリズムが最も評価する（加点最大）',
  },
  {
    post_type: 'shift_announce',
    weight: 30,            // 30%: 出勤告知（感情をセットにすれば安全）
    min_gap_posts: 1,
    risk_level: 'low',
    x_algorithm_note: '感情ありの出勤告知はOK。時間だけの投稿はBot判定リスク',
  },
  {
    post_type: 'vacancy',
    weight: 20,            // 20%: 空き情報（直接的すぎると減点）
    min_gap_posts: 2,
    risk_level: 'medium',
    x_algorithm_note: '空き情報は「来てほしい」感情込みで。「急いで！」系の圧力訴求は減点',
  },
  {
    post_type: 'media',
    weight: 10,            // 10%: 写真・動画（週数回が最適）
    min_gap_posts: 3,
    risk_level: 'low',
    x_algorithm_note: '写真・動画は最もエンゲージが高い。頻度は週3〜4回が最適',
  },
]

// ─────────────────────────────────────────────
// リスクキーワード（Xのシャドウバンを引き起こす）
// ─────────────────────────────────────────────
const HIGH_RISK_KEYWORDS = [
  // 直接的なサービス案内（凍結リスク高）
  '料金', '予約はこちら', 'LINE@', '本日限り', '今だけ',
  // 露骨な表現
  '性感', '大人の', 'エッチ', 'セクシー系',
  // スパム判定されやすい
  '急募', '緊急募集', '今すぐ', 'DM歓迎',
]

const MEDIUM_RISK_KEYWORDS = [
  // やや直接的な宣伝
  '割引', 'セール', 'キャンペーン中', '特典あり',
  // 過度な訴求
  '絶対', '確実', '100%', '保証',
]

const SAFE_ALTERNATIVES: Record<string, string> = {
  '料金': 'ご投資',
  '予約': 'ご来店',
  'コース': 'プラン',
  '割引': '感謝価格',
  'セール': '感謝企画',
  'キャンペーン': '感謝イベント',
  '今すぐ': 'よかったら',
  '急いで': 'よろしければ',
}

// ─────────────────────────────────────────────
// リスクパターン（正規表現）
// ─────────────────────────────────────────────
const SUSPICIOUS_PATTERNS = [
  { pattern: /[!！]{3,}/, desc: '感嘆符3連続以上', risk: 2 },
  { pattern: /[?？]{3,}/, desc: '疑問符3連続以上', risk: 2 },
  { pattern: /(#\w+\s*){8,}/, desc: 'ハッシュタグ8個以上', risk: 3 },
  { pattern: /(.)\1{4,}/, desc: '同一文字5連続以上', risk: 2 },
  { pattern: /(【.{0,10}】){3,}/, desc: '【】記号の多用', risk: 1 },
  { pattern: /http\S+.*http\S+/, desc: 'URL2個以上', risk: 2 },
]

// ─────────────────────────────────────────────
// リスク評価結果
// ─────────────────────────────────────────────
export interface RiskAssessment {
  score: number             // リスクスコア（0=安全、5以上=危険）
  level: 'safe' | 'caution' | 'danger'
  factors: string[]         // リスク要因一覧
  suggestions: string[]     // 修正提案
  modified_content?: string // 自動修正済みテキスト
}

// ─────────────────────────────────────────────
// メインクラス: BanGuard
// ─────────────────────────────────────────────
export class BanGuard {

  // ── リスク評価 ──
  assess(content: string): RiskAssessment {
    let score = 0
    const factors: string[] = []
    const suggestions: string[] = []
    let modifiedContent = content

    // 高リスクキーワードチェック
    for (const kw of HIGH_RISK_KEYWORDS) {
      if (content.includes(kw)) {
        score += 3
        factors.push(`高リスクワード: 「${kw}」`)
        suggestions.push(`「${kw}」を削除または言い換えてください`)
        if (SAFE_ALTERNATIVES[kw]) {
          modifiedContent = modifiedContent.replaceAll(kw, SAFE_ALTERNATIVES[kw])
        } else {
          modifiedContent = modifiedContent.replaceAll(kw, '')
        }
      }
    }

    // 中リスクキーワードチェック
    for (const kw of MEDIUM_RISK_KEYWORDS) {
      if (content.includes(kw)) {
        score += 1
        factors.push(`注意ワード: 「${kw}」`)
        suggestions.push(`「${kw}」はより自然な表現に`)
        if (SAFE_ALTERNATIVES[kw]) {
          modifiedContent = modifiedContent.replaceAll(kw, SAFE_ALTERNATIVES[kw])
        }
      }
    }

    // 疑わしいパターンチェック
    for (const { pattern, desc, risk } of SUSPICIOUS_PATTERNS) {
      if (pattern.test(content)) {
        score += risk
        factors.push(`スパムパターン: ${desc}`)
        suggestions.push(`${desc}を修正してください`)
        modifiedContent = modifiedContent.replace(pattern, '')
      }
    }

    // 文字数チェック（短すぎ・長すぎ）
    if (content.length < 10) {
      score += 2
      factors.push('テキストが短すぎます（10文字未満）')
      suggestions.push('もう少し内容を加えてください')
    }
    if (content.length > 280) {
      score += 1
      factors.push(`文字数超過: ${content.length}文字（X上限280文字）`)
      suggestions.push('140〜200文字に収めるのが理想的です')
    }

    // テンプレ感チェック（定型句の多用）
    const templatePhrases = [
      'よろしくお願いします', 'ご予約お待ちしております', 'ご連絡ください',
    ]
    const templateCount = templatePhrases.filter(p => content.includes(p)).length
    if (templateCount >= 2) {
      score += 2
      factors.push('テンプレ感が強い（同じ定型句を複数使用）')
      suggestions.push('表現をより自然で個性的な言葉に変えてください')
    }

    return {
      score,
      level: score === 0 ? 'safe' : score <= 3 ? 'caution' : 'danger',
      factors,
      suggestions,
      modified_content: modifiedContent !== content ? modifiedContent.trim() : undefined,
    }
  }

  // ── 投稿してOKか判定 ──
  isSafeToPost(content: string): boolean {
    const { score } = this.assess(content)
    return score < 4
  }

  // ── 人間らしい投稿時間かチェック ──
  isActiveTime(hour?: number): boolean {
    const h = hour ?? new Date().getHours()
    return ACTIVE_TIME_SLOTS.some(slot => h >= slot.hour_start && h < slot.hour_end)
  }

  // ── この時間帯の重みを返す（高いほど投稿に最適）──
  getTimeWeight(hour?: number): number {
    const h = hour ?? new Date().getHours()
    const slot = ACTIVE_TIME_SLOTS.find(s => h >= s.hour_start && h < s.hour_end)
    return slot?.weight ?? 0
  }

  // ── フェーズ設定を取得 ──
  getPhaseConfig(phase: GrowthPhase): PhaseConfig {
    return PHASE_CONFIGS[phase]
  }

  // ── 投稿間隔が適切か（Bot判定を避ける）──
  isIntervalSafe(lastPostTime: Date, phase: GrowthPhase): boolean {
    const config = PHASE_CONFIGS[phase]
    const hoursElapsed = (Date.now() - lastPostTime.getTime()) / (1000 * 60 * 60)
    return hoursElapsed >= config.min_interval_hours
  }

  // ── コンテンツタイプのローテーション（重み付きランダム）──
  pickContentType(recentTypes: PostType[], count = 1): PostType[] {
    const results: PostType[] = []

    for (let i = 0; i < count; i++) {
      const allRecent = [...recentTypes, ...results]

      // 最小ギャップを考慮してフィルタ
      const available = CONTENT_TYPE_CONFIGS.filter(config => {
        const lastIdx = allRecent.lastIndexOf(config.post_type)
        if (lastIdx === -1) return true
        return allRecent.length - 1 - lastIdx >= config.min_gap_posts
      })

      const pool = available.length > 0 ? available : CONTENT_TYPE_CONFIGS

      // ウェイトに基づいてランダム選択
      const totalWeight = pool.reduce((s, c) => s + c.weight, 0)
      let rand = Math.random() * totalWeight
      let selected = pool[pool.length - 1]

      for (const config of pool) {
        rand -= config.weight
        if (rand <= 0) {
          selected = config
          break
        }
      }

      results.push(selected.post_type)
    }

    return results
  }

  // ── ランダムな投稿間隔を生成（人間らしいばらつき）──
  getRandomInterval(phase: GrowthPhase): number {
    const config = PHASE_CONFIGS[phase]
    const min = config.min_interval_hours * 60  // 分に変換
    const max = config.max_interval_hours * 60
    // 正規分布的なランダム（完全ランダムより自然）
    const rand = (Math.random() + Math.random() + Math.random()) / 3
    return Math.floor(min + rand * (max - min))
  }
}

// シングルトンインスタンス
export const banGuard = new BanGuard()

// ─────────────────────────────────────────────
// ユーティリティ関数
// ─────────────────────────────────────────────

// フェーズをアカウント年齢から自動判定
export function detectPhase(accountCreatedAt: Date): GrowthPhase {
  const daysOld = (Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
  if (daysOld < 14) return 'warmup'
  if (daysOld < 45) return 'growth'
  return 'maintenance'
}

// 今日の推奨投稿数をフェーズから取得
export function getRecommendedPostCount(phase: GrowthPhase): number {
  const config = PHASE_CONFIGS[phase]
  return Math.floor(
    config.daily_post_min + Math.random() * (config.daily_post_max - config.daily_post_min)
  )
}

// 最適な投稿時間リストを生成（今日の日付で）
export function getOptimalPostTimes(count: number, baseDate?: Date): Date[] {
  const date = baseDate ?? new Date()
  const times: Date[] = []

  // ウェイト順にスロットをソートして上位から選択
  const sortedSlots = [...ACTIVE_TIME_SLOTS]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, Math.min(count, ACTIVE_TIME_SLOTS.length))

  for (const slot of sortedSlots) {
    const t = new Date(date)
    // スロット内のランダムな時間
    const hour = slot.hour_start + Math.floor(Math.random() * (slot.hour_end - slot.hour_start))
    const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)]
    t.setHours(hour, minute, 0, 0)
    times.push(t)
  }

  return times.sort((a, b) => a.getTime() - b.getTime())
}
