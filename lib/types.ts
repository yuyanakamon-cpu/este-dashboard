export type Platform = 'x' | 'bluesky' | 'threads' | 'instagram'
export type PostType = 'shift_announce' | 'vacancy' | 'personality' | 'media'
export type PostStatus = 'scheduled' | 'posted' | 'draft' | 'failed'
export type CastStatus = 'on_shift' | 'off_shift' | 'break'

export interface PlatformAccount {
  connected: boolean; username: string; followers: number
  posts_today: number; posts_this_month: number; engagement_rate: number
}

export interface Post {
  id: string; cast_id: string; platforms: Platform[]; type: PostType
  content: string; media_url?: string; scheduled_at: string; status: PostStatus
  likes?: number; reposts?: number; replies?: number
}

export interface Cast {
  id: string; name: string; display_name: string; age: number; area: string
  status: CastStatus; avatar_initial: string; avatar_color: string
  character_desc: string; personality_tags: string[]
  shift_start: string; shift_end: string; shift_days: number[]
  platforms: Record<Platform, PlatformAccount>; posts: Post[]
  monthly_bookings_estimated: number; monthly_follower_growth: number
}
