import type { Cast, Post } from './types'

function generatePosts(castId: string): Post[] {
  const today = new Date().toISOString().split('T')[0]
  return [
    { id: `${castId}-1`, cast_id: castId, platforms: ['x','bluesky'], type: 'shift_announce',
      content: '本日も出勤しています\u{1F338}\n12\u6642\uff5eラスト予定です！\nお気軽にDMください\u{1F48C}\n#メンズエステ #出勤',
      scheduled_at: `${today}T08:00:00`, status: 'posted', likes: 42, reposts: 8, replies: 3 },
    { id: `${castId}-2`, cast_id: castId, platforms: ['x'], type: 'vacancy',
      content: '【空き情報】\n急なキャンセルで空きが出ました！\nご連絡お待ちしてます\u{1F495}\n#メンズエステ #空き',
      scheduled_at: `${today}T13:30:00`, status: 'posted', likes: 28, reposts: 4, replies: 7 },
    { id: `${castId}-3`, cast_id: castId, platforms: ['x','bluesky','threads'], type: 'personality',
      content: '今日もお客様に癒していただきました\u{1F60A}\nありがとうございます\u{1F337}\nまた会える日を楽しみにしてます\u{2728}',
      scheduled_at: `${today}T17:00:00`, status: 'scheduled' },
    { id: `${castId}-4`, cast_id: castId, platforms: ['x','bluesky'], type: 'vacancy',
      content: '【夜の空き情報\u{1F319}】\n19\u6642\uff5e21\u6642、まだご予約可能です！\nお仕事帰りにぜひ\u{1F4AB}\n#メンズエステ #夜',
      scheduled_at: `${today}T18:00:00`, status: 'scheduled' },
    { id: `${castId}-5`, cast_id: castId, platforms: ['x','bluesky','threads'], type: 'shift_announce',
      content: '本日もありがとうございました\u{1F64F}\n明日も出勤予定です！\nDMいつでもお待ちしてます\u{1F495}',
      scheduled_at: `${today}T22:00:00`, status: 'scheduled' },
    { id: `${castId}-6`, cast_id: castId, platforms: ['instagram'], type: 'media',
      content: '今日のコーデ\u{1F4F8}\nいつも来てくださる方々に感謝\u{1F338}\n#メンズエステ #セラピスト',
      scheduled_at: `${today}T12:00:00`, status: 'draft' },
  ]
}

export const CASTS: Cast[] = [
  { id:'cast-1', name:'さくら', display_name:'桜 \u{1F338}', age:22, area:'新宿', status:'on_shift',
    avatar_initial:'さ', avatar_color:'bg-rose-100 text-rose-700',
    character_desc:'明るくてさっぱりした性格。会話が得意で初めての方でも安心できる雰囲気を大切にしています。',
    personality_tags:['明るい','話しやすい','癒し系','甘え上手'],
    shift_start:'11:00', shift_end:'22:00', shift_days:[1,2,3,4,5],
    platforms:{
      x:        {connected:true, username:'sakura_este',         followers:2840,posts_today:4,posts_this_month:87, engagement_rate:6.2},
      bluesky:  {connected:true, username:'sakura.bsky.social',  followers:420, posts_today:2,posts_this_month:45, engagement_rate:5.8},
      threads:  {connected:true, username:'sakura_este',         followers:310, posts_today:1,posts_this_month:28, engagement_rate:4.1},
      instagram:{connected:true, username:'sakura_este_shinjuku',followers:1240,posts_today:0,posts_this_month:12, engagement_rate:7.3},
    },
    posts:generatePosts('cast-1'), monthly_bookings_estimated:28, monthly_follower_growth:340 },
  { id:'cast-2', name:'みお', display_name:'澪 \u{1F499}', age:24, area:'渋谷', status:'on_shift',
    avatar_initial:'み', avatar_color:'bg-sky-100 text-sky-700',
    character_desc:'落ち着いた雰囲気でのんびり過ごしたい方に人気。リラックスできる空間づくりが得意です。',
    personality_tags:['落ち着き','ゆったり','癒し','知的'],
    shift_start:'13:00', shift_end:'23:00', shift_days:[3,4,5,6,0],
    platforms:{
      x:        {connected:true, username:'mio_relax',      followers:1960,posts_today:3,posts_this_month:72,engagement_rate:5.4},
      bluesky:  {connected:true, username:'mio-relax.bsky', followers:280, posts_today:2,posts_this_month:38,engagement_rate:4.9},
      threads:  {connected:false,username:'',               followers:0,   posts_today:0,posts_this_month:0, engagement_rate:0},
      instagram:{connected:true, username:'mio_est_shibuya',followers:980, posts_today:1,posts_this_month:10,engagement_rate:6.8},
    },
    posts:generatePosts('cast-2'), monthly_bookings_estimated:22, monthly_follower_growth:210 },
  { id:'cast-3', name:'りな', display_name:'里奈 \u{1F319}', age:21, area:'池袋', status:'off_shift',
    avatar_initial:'り', avatar_color:'bg-purple-100 text-purple-700',
    character_desc:'元気でノリが良い！テンション高めで楽しく過ごしたい方とのセッションが大得意です。',
    personality_tags:['元気','明るい','活発','ノリが良い'],
    shift_start:'14:00', shift_end:'00:00', shift_days:[5,6,0],
    platforms:{
      x:        {connected:true,username:'rina_ikebukuro',     followers:3120,posts_today:0,posts_this_month:95,engagement_rate:7.8},
      bluesky:  {connected:true,username:'rina-este.bsky',     followers:560, posts_today:0,posts_this_month:52,engagement_rate:6.1},
      threads:  {connected:true,username:'rina_este',          followers:440, posts_today:0,posts_this_month:32,engagement_rate:5.2},
      instagram:{connected:true,username:'rina_este_ikebukuro',followers:1680,posts_today:0,posts_this_month:16,engagement_rate:8.4},
    },
    posts:generatePosts('cast-3'), monthly_bookings_estimated:35, monthly_follower_growth:480 },
  { id:'cast-4', name:'ゆい', display_name:'結衣 \u{1F337}', age:23, area:'六本木', status:'break',
    avatar_initial:'ゆ', avatar_color:'bg-amber-100 text-amber-700',
    character_desc:'上品で大人っぽい雰囲気。落ち着いたひとときを大切にする方に寄り添うスタイル。',
    personality_tags:['上品','大人っぽい','しっとり','聞き上手'],
    shift_start:'15:00', shift_end:'23:00', shift_days:[1,2,3,5,6],
    platforms:{
      x:        {connected:true, username:'yui_roppongi',      followers:1540,posts_today:2,posts_this_month:58,engagement_rate:4.9},
      bluesky:  {connected:false,username:'',                  followers:0,   posts_today:0,posts_this_month:0, engagement_rate:0},
      threads:  {connected:true, username:'yui_este',          followers:280, posts_today:1,posts_this_month:20,engagement_rate:3.8},
      instagram:{connected:true, username:'yui_este_roppongi', followers:2100,posts_today:0,posts_this_month:14,engagement_rate:9.1},
    },
    posts:generatePosts('cast-4'), monthly_bookings_estimated:18, monthly_follower_growth:150 },
  { id:'cast-5', name:'あいな', display_name:'愛菜 \u{2728}', age:25, area:'銀座', status:'off_shift',
    avatar_initial:'あ', avatar_color:'bg-green-100 text-green-700',
    character_desc:'包み込むような優しさが特徴。ストレスを抱えた方に特に人気のある癒しの存在です。',
    personality_tags:['優しい','包容力','癒し','ほんわか'],
    shift_start:'12:00', shift_end:'21:00', shift_days:[1,2,4,5],
    platforms:{
      x:        {connected:true,username:'aina_ginza',      followers:2280,posts_today:0,posts_this_month:68,engagement_rate:6.7},
      bluesky:  {connected:true,username:'aina-este.bsky',  followers:390, posts_today:0,posts_this_month:42,engagement_rate:5.5},
      threads:  {connected:true,username:'aina_este',       followers:520, posts_today:0,posts_this_month:38,engagement_rate:4.6},
      instagram:{connected:true,username:'aina_este_ginza', followers:3200,posts_today:0,posts_this_month:18,engagement_rate:10.2},
    },
    posts:generatePosts('cast-5'), monthly_bookings_estimated:24, monthly_follower_growth:290 },
]

export function getCast(id: string): Cast | undefined {
  return CASTS.find((c) => c.id === id)
}

export const PLATFORM_LABELS: Record<string, string> = {
  x:'𝕏 Twitter', bluesky:'Bluesky', threads:'Threads', instagram:'Instagram',
}

export const POST_TYPE_LABELS: Record<string, string> = {
  shift_announce:'出勤告知', vacancy:'空き情報', personality:'人柄・日常', media:'写真・動画',
}

export const POST_TYPE_COLORS: Record<string, string> = {
  shift_announce:'bg-rose-100 text-rose-700', vacancy:'bg-amber-100 text-amber-700',
  personality:'bg-purple-100 text-purple-700', media:'bg-sky-100 text-sky-700',
}
