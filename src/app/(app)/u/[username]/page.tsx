'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, MessageSquare, ChevronUp, ChevronDown,
  Calendar, MapPin, ExternalLink, UserPlus, UserCheck,
  TrendingUp, TrendingDown, Shield,
} from 'lucide-react'

// ── Deterministic avatar gradient ─────────────────────────────────────────────

function avatarColors(username: string): [string, string] {
  const palettes: [string, string][] = [
    ['#ccff00', '#00ff88'],
    ['#60a5fa', '#a78bfa'],
    ['#f59e0b', '#f87171'],
    ['#4ade80', '#22d3ee'],
    ['#f472b6', '#fb923c'],
    ['#818cf8', '#34d399'],
  ]
  const idx = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palettes.length
  return palettes[idx]
}

// ── Stub data ─────────────────────────────────────────────────────────────────

const STANCE_COLOR: Record<string, string> = {
  BULLISH:  '#4ade80',
  BEARISH:  '#f87171',
  NEUTRAL:  '#94918d',
  RESEARCH: '#60a5fa',
  QUESTION: '#f59e0b',
}

const STUB_USER = {
  displayName: 'quant_macro',
  bio: 'Macro & semi-conductor analyst. Focused on AI infrastructure, sovereign compute, and earnings cycles. DM open.',
  location: 'New York',
  website: 'quantmacro.substack.com',
  joined: 'March 2024',
  posts: 184,
  followers: 1203,
  following: 87,
  watching: 14,
  verified: true,
}

const STUB_POSTS = [
  { id:'1', stance:'BULLISH',  symbol:'NVDA', title:'Blackwell ramp is structurally underpriced — data center demand exceeds all prior estimates', time:'2h',  votes:142, comments:38 },
  { id:'2', stance:'RESEARCH', symbol:'NVDA', title:'Full margin analysis: NVDA Q2 gross margin trajectory and implications for FY2026 guidance',   time:'4h',  votes:89,  comments:24 },
  { id:'3', stance:'BEARISH',  symbol:'TSLA', title:'Margin compression story is intact — ARPU per vehicle declining faster than consensus models', time:'1d',  votes:61,  comments:19 },
  { id:'4', stance:'BULLISH',  symbol:'MSFT', title:'Sovereign AI spend is a 10-year tailwind — analysts are modeling enterprise Azure too conservatively', time:'2d', votes:76, comments:18 },
  { id:'5', stance:'QUESTION', symbol:'AMD',  title:'How much of AMD\'s MI300X backlog converts to recurring revenue vs. one-time hyperscaler builds?', time:'3d', votes:44, comments:31 },
]

const STUB_THESES = STUB_POSTS.filter(p => p.stance === 'BULLISH' || p.stance === 'BEARISH')
const STUB_RESEARCH = STUB_POSTS.filter(p => p.stance === 'RESEARCH')

const STUB_REPLIES = [
  { id:'r1', inReplyTo:{ symbol:'NVDA', title:'Sovereign AI is overhyped — most deals are MoUs not revenue' }, body:'Respectfully disagree — the Saudi NEOM deal alone was $600M ARR confirmed in the Q2 call. MoU-to-contract conversion rate is tracking above initial guidance.', time:'5h', votes:34 },
  { id:'r2', inReplyTo:{ symbol:'AAPL', title:'Services margin peak is in — growth rate decelerates into FY26' }, body:'The App Store gross margin has been compressing since DMA enforcement. But the hardware attach rate on Vision Pro accessories is a genuine upside wildcard.', time:'1d', votes:21 },
]

const WATCHING = [
  { symbol:'NVDA', change: 3.21,  up: true  },
  { symbol:'TSLA', change:-1.87,  up: false },
  { symbol:'MSFT', change: 1.12,  up: true  },
  { symbol:'AMD',  change:-2.14,  up: false },
  { symbol:'PLTR', change: 4.32,  up: true  },
]

type ProfileTab = 'posts' | 'theses' | 'research' | 'replies' | 'about'

// ── Post row ──────────────────────────────────────────────────────────────────

function PostRow({ post }: { post: typeof STUB_POSTS[0] }) {
  const [vote, setVote] = useState<'up'|'down'|null>(null)
  const count = post.votes + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0)
  const sc = STANCE_COLOR[post.stance]

  return (
    <div style={{
      display:'flex', gap:12, padding:'14px 20px',
      borderBottom:'1px solid var(--border-subtle)',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:28, paddingTop:2, flexShrink:0 }}>
        <button onClick={() => setVote(v => v==='up'?null:'up')} aria-label="Upvote"
          style={{ background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:4, color:vote==='up'?'var(--up)':'var(--text-3)', transition:'color 120ms' }}>
          <ChevronUp size={13} strokeWidth={vote==='up'?2.5:1.5} />
        </button>
        <span style={{ fontSize:11, fontWeight:600, fontVariantNumeric:'tabular-nums', color:vote==='up'?'var(--up)':vote==='down'?'var(--down)':'var(--text-2)' }}>{count}</span>
        <button onClick={() => setVote(v => v==='down'?null:'down')} aria-label="Downvote"
          style={{ background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:4, color:vote==='down'?'var(--down)':'var(--text-3)', transition:'color 120ms' }}>
          <ChevronDown size={13} strokeWidth={vote==='down'?2.5:1.5} />
        </button>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
          <Link href={`/market/${post.symbol}`} style={{ textDecoration:'none' }}>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.04em', color:'var(--text-1)', background:'var(--surface-raised)', border:'1px solid var(--border)', padding:'1px 6px', borderRadius:'var(--radius-badge)' }}>
              {post.symbol}
            </span>
          </Link>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em', color:sc, background:`${sc}18`, padding:'1px 6px', borderRadius:'var(--radius-badge)' }}>
            {post.stance}
          </span>
        </div>
        <p style={{ fontSize:13, fontWeight:500, color:'var(--text-1)', lineHeight:1.45, marginBottom:7 }}>{post.title}</p>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--text-3)' }}>
          <span>{post.time}</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}>
            <MessageSquare size={11} strokeWidth={1.5} />{post.comments}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Reply row ─────────────────────────────────────────────────────────────────

function ReplyRow({ reply }: { reply: typeof STUB_REPLIES[0] }) {
  const [vote, setVote] = useState<'up'|'down'|null>(null)
  const count = reply.votes + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0)

  return (
    <div style={{
      padding:'14px 20px',
      borderBottom:'1px solid var(--border-subtle)',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Replying to */}
      <div style={{
        display:'flex', alignItems:'center', gap:6, marginBottom:8,
        padding:'7px 10px',
        background:'var(--surface-raised)', borderRadius:6,
        borderLeft:'2px solid var(--border)',
      }}>
        <Link href={`/market/${reply.inReplyTo.symbol}`} style={{ textDecoration:'none' }}>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.04em', color:'var(--text-2)', background:'var(--surface)', border:'1px solid var(--border)', padding:'1px 5px', borderRadius:'var(--radius-badge)' }}>
            {reply.inReplyTo.symbol}
          </span>
        </Link>
        <span style={{ fontSize:11, color:'var(--text-3)', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {reply.inReplyTo.title}
        </span>
      </div>
      <div style={{ display:'flex', gap:12 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:28, paddingTop:2, flexShrink:0 }}>
          <button onClick={() => setVote(v => v==='up'?null:'up')} aria-label="Upvote"
            style={{ background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:4, color:vote==='up'?'var(--up)':'var(--text-3)', transition:'color 120ms' }}>
            <ChevronUp size={13} strokeWidth={vote==='up'?2.5:1.5} />
          </button>
          <span style={{ fontSize:11, fontWeight:600, fontVariantNumeric:'tabular-nums', color:vote==='up'?'var(--up)':vote==='down'?'var(--down)':'var(--text-2)' }}>{count}</span>
          <button onClick={() => setVote(v => v==='down'?null:'down')} aria-label="Downvote"
            style={{ background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:4, color:vote==='down'?'var(--down)':'var(--text-3)', transition:'color 120ms' }}>
            <ChevronDown size={13} strokeWidth={vote==='down'?2.5:1.5} />
          </button>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.55, marginBottom:7 }}>{reply.body}</p>
          <span style={{ fontSize:12, color:'var(--text-3)' }}>{reply.time}</span>
        </div>
      </div>
    </div>
  )
}

// ── Activity sparkline (mini SVG bar chart) ───────────────────────────────────

function ActivityChart() {
  // 30-day post frequency (mock)
  const bars = [2,0,3,1,4,2,0,1,3,5,2,1,4,3,2,1,0,3,4,2,1,3,5,4,2,1,2,3,1,4]
  const max = Math.max(...bars)
  const W = 180, H = 36, gap = 2
  const bw = (W - gap * (bars.length - 1)) / bars.length

  return (
    <svg width={W} height={H} aria-hidden="true">
      {bars.map((v, i) => {
        const h = v === 0 ? 2 : Math.max(3, (v / max) * (H - 4))
        const x = i * (bw + gap)
        return (
          <rect
            key={i} x={x} y={H - h} width={bw} height={h}
            rx={1.5}
            fill={v === 0 ? 'var(--border)' : 'var(--accent)'}
            opacity={v === 0 ? 1 : 0.55 + (v / max) * 0.45}
          />
        )
      })}
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const [tab, setTab] = useState<ProfileTab>('posts')
  const [following, setFollowing] = useState(false)

  const TABS: { key: ProfileTab; label: string; count?: number }[] = [
    { key: 'posts',    label: 'Posts',    count: STUB_USER.posts  },
    { key: 'theses',   label: 'Theses',   count: STUB_THESES.length  },
    { key: 'research', label: 'Research', count: STUB_RESEARCH.length },
    { key: 'replies',  label: 'Replies',  count: STUB_REPLIES.length  },
    { key: 'about',    label: 'About'     },
  ]

  const feedPosts =
    tab === 'posts'    ? STUB_POSTS    :
    tab === 'theses'   ? STUB_THESES   :
    tab === 'research' ? STUB_RESEARCH : []

  const [c1, c2] = avatarColors(username)
  const initials = username.slice(0, 2).toUpperCase()

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px 64px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>

      {/* ── Left / main column ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Back */}
        <div style={{ padding: '20px 0 0' }}>
          <Link href="/explore" style={{
            display:'inline-flex', alignItems:'center', gap:6,
            fontSize:13, color:'var(--text-3)', textDecoration:'none',
            transition:'color 150ms',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            <ArrowLeft size={13} strokeWidth={1.5} />
            Back
          </Link>
        </div>

        {/* Profile header */}
        <div style={{
          padding:'24px 0 20px',
          borderBottom:'1px solid var(--border)',
        }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:16 }}>

            {/* Avatar */}
            <div style={{
              width:60, height:60, borderRadius:'50%', flexShrink:0,
              background:`linear-gradient(135deg, ${c1}, ${c2})`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <span style={{ fontSize:20, fontWeight:800, color:'#110e08', letterSpacing:'-0.02em' }}>{initials}</span>
            </div>

            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.025em', color:'var(--text-1)' }}>
                  {STUB_USER.displayName}
                </h1>
                {STUB_USER.verified && (
                  <span title="Verified human" style={{ color:'#60a5fa', display:'flex', alignItems:'center' }}>
                    <Shield size={14} strokeWidth={2} />
                  </span>
                )}
              </div>
              <p style={{ fontSize:13, color:'var(--text-3)', marginBottom:10 }}>@{username}</p>
              <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6, marginBottom:10, maxWidth:480 }}>
                {STUB_USER.bio}
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:14, fontSize:12, color:'var(--text-3)' }}>
                {STUB_USER.location && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                    <MapPin size={11} strokeWidth={1.5} />{STUB_USER.location}
                  </span>
                )}
                {STUB_USER.website && (
                  <a href={`https://${STUB_USER.website}`} target="_blank" rel="noopener"
                    style={{ display:'inline-flex', alignItems:'center', gap:4, color:'var(--accent)', textDecoration:'none' }}>
                    <ExternalLink size={11} strokeWidth={1.5} />{STUB_USER.website}
                  </a>
                )}
                <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                  <Calendar size={11} strokeWidth={1.5} />Joined {STUB_USER.joined}
                </span>
              </div>
            </div>

            {/* Follow button */}
            <button
              onClick={() => setFollowing(f => !f)}
              style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'8px 16px', borderRadius:'var(--radius-pill)',
                border: following ? '1px solid var(--border)' : '1px solid var(--accent)',
                background: following ? 'transparent' : 'var(--accent)',
                color: following ? 'var(--text-2)' : 'var(--accent-text)',
                fontSize:13, fontWeight:600, cursor:'pointer',
                transition:'all 150ms', flexShrink:0,
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {following
                ? <><UserCheck size={13} strokeWidth={2} />Following</>
                : <><UserPlus  size={13} strokeWidth={2} />Follow</>
              }
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display:'flex', gap:20, fontSize:13, color:'var(--text-3)' }}>
            {[
              { label:'posts',     val: STUB_USER.posts     },
              { label:'followers', val: STUB_USER.followers  },
              { label:'following', val: STUB_USER.following  },
              { label:'watching',  val: STUB_USER.watching   },
            ].map(s => (
              <span key={s.label}>
                <span style={{ color:'var(--text-1)', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>
                  {s.val >= 1000 ? `${(s.val/1000).toFixed(1)}k` : s.val}
                </span>{' '}{s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
          {TABS.map(({ key, label, count }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding:'12px 14px 11px',
              border:'none', borderBottom: tab===key ? '2px solid var(--accent)' : '2px solid transparent',
              background:'transparent',
              color: tab===key ? 'var(--text-1)' : 'var(--text-3)',
              fontSize:13, fontWeight: tab===key ? 600 : 400,
              cursor:'pointer', marginBottom:-1,
              transition:'color 120ms, border-color 120ms',
              display:'flex', alignItems:'center', gap:5,
            }}>
              {label}
              {count !== undefined && (
                <span style={{
                  fontSize:10, fontWeight:600, fontVariantNumeric:'tabular-nums',
                  color: tab===key ? 'var(--accent)' : 'var(--text-3)',
                  background: tab===key ? 'var(--accent-dim)' : 'transparent',
                  padding:'1px 5px', borderRadius:'var(--radius-badge)',
                  transition:'color 120ms, background 120ms',
                }}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Post feed */}
        {(tab === 'posts' || tab === 'theses' || tab === 'research') && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderTop:'none', borderRadius:'0 0 var(--radius-card) var(--radius-card)' }}>
            {feedPosts.length > 0
              ? feedPosts.map(p => <PostRow key={p.id} post={p} />)
              : (
                <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--text-3)', fontSize:13 }}>
                  No {tab} yet.
                </div>
              )
            }
          </div>
        )}

        {/* Replies */}
        {tab === 'replies' && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderTop:'none', borderRadius:'0 0 var(--radius-card) var(--radius-card)' }}>
            {STUB_REPLIES.map(r => <ReplyRow key={r.id} reply={r} />)}
          </div>
        )}

        {/* About */}
        {tab === 'about' && (
          <div style={{ padding:'28px 0', display:'flex', flexDirection:'column', gap:20 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8 }}>Bio</p>
              <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.65 }}>{STUB_USER.bio}</p>
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8 }}>Details</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:1, background:'var(--border)', borderRadius:8, overflow:'hidden' }}>
                {[
                  { label:'Account type', value:'Human'               },
                  { label:'Location',     value:STUB_USER.location    },
                  { label:'Joined',       value:STUB_USER.joined      },
                  { label:'Verified',     value:STUB_USER.verified ? 'Yes' : 'No' },
                ].map(row => (
                  <div key={row.label} style={{ background:'var(--surface)', padding:'12px 16px' }}>
                    <p style={{ fontSize:11, color:'var(--text-3)', marginBottom:3 }}>{row.label}</p>
                    <p style={{ fontSize:13, fontWeight:500, color:'var(--text-1)' }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8 }}>Stance history</p>
              <div style={{ display:'flex', gap:10 }}>
                {[
                  { label:'Bullish', count:91, color:'var(--up)' },
                  { label:'Bearish', count:43, color:'var(--down)' },
                  { label:'Neutral', count:22, color:'var(--text-3)' },
                  { label:'Research',count:28, color:'#60a5fa' },
                ].map(s => (
                  <div key={s.label} style={{
                    flex:1, background:'var(--surface)', border:'1px solid var(--border)',
                    borderRadius:8, padding:'12px 14px',
                  }}>
                    <p style={{ fontSize:18, fontWeight:700, color:s.color, fontVariantNumeric:'tabular-nums', marginBottom:2 }}>{s.count}</p>
                    <p style={{ fontSize:11, color:'var(--text-3)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right sidebar ── */}
      <aside style={{
        width: 256, flexShrink: 0,
        position: 'sticky', top: 24,
        paddingTop: 52,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>

        {/* Activity */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-card)', padding:'16px 18px' }}>
          <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>Activity — 30d</p>
          <ActivityChart />
          <p style={{ fontSize:11, color:'var(--text-3)', marginTop:8 }}>
            <span style={{ color:'var(--text-1)', fontWeight:600 }}>28</span> posts this month
          </p>
        </div>

        {/* Watching */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-card)', overflow:'hidden' }}>
          <div style={{ padding:'14px 16px 8px', borderBottom:'1px solid var(--border-subtle)' }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Watching</p>
          </div>
          {WATCHING.map((a, i) => (
            <Link key={a.symbol} href={`/market/${a.symbol}`} style={{ textDecoration:'none' }}>
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 16px',
                borderBottom: i < WATCHING.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                transition:'background 120ms',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', fontFamily:'var(--font-mono)', letterSpacing:'0.02em' }}>{a.symbol}</span>
                <span style={{
                  fontSize:11, fontWeight:600, fontVariantNumeric:'tabular-nums',
                  color: a.up ? 'var(--up)' : 'var(--down)',
                  display:'flex', alignItems:'center', gap:3,
                }}>
                  {a.up ? <TrendingUp size={10} strokeWidth={2}/> : <TrendingDown size={10} strokeWidth={2}/>}
                  {a.up ? '+' : ''}{a.change.toFixed(2)}%
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Top assets by stance */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-card)', padding:'14px 16px 16px' }}>
          <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>Most covered</p>
          {[
            { symbol:'NVDA', posts:74, stance:'BULLISH', sc:STANCE_COLOR.BULLISH },
            { symbol:'TSLA', posts:31, stance:'BEARISH', sc:STANCE_COLOR.BEARISH },
            { symbol:'MSFT', posts:28, stance:'BULLISH', sc:STANCE_COLOR.BULLISH },
            { symbol:'AMD',  posts:18, stance:'NEUTRAL', sc:STANCE_COLOR.NEUTRAL },
          ].map(a => {
            const maxPosts = 74
            return (
              <div key={a.symbol} style={{ marginBottom:9 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                  <Link href={`/market/${a.symbol}`} style={{ textDecoration:'none' }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--text-1)', fontFamily:'var(--font-mono)' }}>{a.symbol}</span>
                  </Link>
                  <span style={{ fontSize:10, fontWeight:700, color:a.sc }}>{a.stance}</span>
                </div>
                <div style={{ height:4, background:'var(--surface-raised)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${(a.posts/maxPosts)*100}%`, background:a.sc, opacity:0.7, borderRadius:2, transition:'width 400ms' }} />
                </div>
                <span style={{ fontSize:10, color:'var(--text-3)', marginTop:2, display:'block' }}>{a.posts} posts</span>
              </div>
            )
          })}
        </div>

      </aside>
    </div>
  )
}
