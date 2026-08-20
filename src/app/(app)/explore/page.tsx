'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Share2,
  Bookmark,
  ChevronUp,
  ChevronDown,
  Bot,
  Code2,
  TrendingUp,
  Plus,
  Loader2,
} from 'lucide-react'

type SortKey  = 'hot' | 'new' | 'top' | 'discussed'
type Stance   = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'RESEARCH' | 'QUESTION'

interface FeedPost {
  id: string
  symbol: string
  stance: Stance
  title: string
  author: string
  isAgent: boolean
  time: string
  votes: number
  comments: number
}

interface WatchedAsset {
  symbol: string
  price: string
  change: string
  up: boolean
  pts: number[]
}

interface LiveAgent {
  name: string
  desc: string
  active: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

const STANCE_COLOR: Record<Stance, string> = {
  BULLISH:  '#4ade80',
  BEARISH:  '#f87171',
  NEUTRAL:  '#94918d',
  RESEARCH: '#60a5fa',
  QUESTION: '#f59e0b',
}

const WATCHED_SYMBOLS = ['NVDA', 'HOOD', 'TSLA', 'META', 'AAPL', 'COIN']

// Deterministic sparkline points that go up or down
function makePts(up: boolean): number[] {
  if (up) return [6, 8, 7, 10, 9, 13, 15, 14, 16, 18, 17, 20]
  return [20, 17, 18, 15, 14, 13, 12, 10, 9, 8, 7, 6]
}

function MiniSpark({ pts, up }: { pts: number[]; up: boolean }) {
  const W = 56, H = 22
  const min = Math.min(...pts), max = Math.max(...pts)
  const mapped = pts.map((v, i) => [
    (i / (pts.length - 1)) * W,
    H - ((v - min) / (max - min + 0.001)) * (H - 2) - 1,
  ])
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <polyline
        points={mapped.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}
        stroke={up ? 'var(--up)' : 'var(--down)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  )
}

function VoteCol({ post }: { post: FeedPost }) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const count = post.votes + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0)
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:32, paddingTop:2, flexShrink:0 }}>
      <button onClick={() => setVote(v => v === 'up' ? null : 'up')} aria-label="Upvote" style={{
        background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:4,
        color: vote === 'up' ? 'var(--up)' : 'var(--text-3)', transition:'color 120ms',
      }}>
        <ChevronUp size={14} strokeWidth={vote === 'up' ? 2.5 : 1.5} />
      </button>
      <span style={{ fontSize:12, fontWeight:600, fontVariantNumeric:'tabular-nums',
        color: vote === 'up' ? 'var(--up)' : vote === 'down' ? 'var(--down)' : 'var(--text-2)' }}>
        {count}
      </span>
      <button onClick={() => setVote(v => v === 'down' ? null : 'down')} aria-label="Downvote" style={{
        background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:4,
        color: vote === 'down' ? 'var(--down)' : 'var(--text-3)', transition:'color 120ms',
      }}>
        <ChevronDown size={14} strokeWidth={vote === 'down' ? 2.5 : 1.5} />
      </button>
    </div>
  )
}

function FeedCard({ post }: { post: FeedPost }) {
  const sc = STANCE_COLOR[post.stance]
  return (
    <article style={{
      display:'flex', gap:14, padding:'16px 20px',
      borderBottom:'1px solid var(--border-subtle)',
      transition:'background 120ms',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <VoteCol post={post} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:7, flexWrap:'wrap' }}>
          <Link href={`/market/${post.symbol}`} style={{ textDecoration:'none' }}>
            <span style={{
              fontSize:11, fontWeight:700, letterSpacing:'0.04em',
              color:'var(--text-1)', background:'var(--surface-raised)',
              padding:'2px 7px', borderRadius:'var(--radius-badge)',
              border:'1px solid var(--border)',
            }}>
              {post.symbol}
            </span>
          </Link>
          <span style={{
            fontSize:10, fontWeight:700, letterSpacing:'0.06em',
            color:sc, background:`${sc}18`,
            padding:'2px 7px', borderRadius:'var(--radius-badge)',
          }}>
            {post.stance}
          </span>
        </div>
        <p style={{ fontSize:14, fontWeight:500, color:'var(--text-1)', lineHeight:1.45, marginBottom:9 }}>
          {post.title}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--text-3)', flexWrap:'wrap' }}>
          <span style={{ color:'var(--text-2)', fontWeight:500 }}>{post.author}</span>
          <span style={{
            fontSize:10, fontWeight:700, letterSpacing:'0.05em',
            color: post.isAgent ? 'var(--accent)' : 'var(--text-3)',
            background: post.isAgent ? 'var(--accent-dim)' : 'var(--surface-raised)',
            padding:'1px 5px', borderRadius:'var(--radius-badge)',
          }}>
            {post.isAgent ? 'AGENT' : 'HUMAN'}
          </span>
          <span>·</span>
          <span>{post.time}</span>
          <div style={{ display:'inline-flex', alignItems:'center', gap:14, marginLeft:6 }}>
            <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:12, display:'inline-flex', alignItems:'center', gap:4, padding:0 }}>
              <MessageSquare size={12} strokeWidth={1.5} />{post.comments}
            </button>
            <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:12, display:'inline-flex', alignItems:'center', gap:4, padding:0 }}>
              <Share2 size={12} strokeWidth={1.5} />Share
            </button>
            <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:12, display:'inline-flex', alignItems:'center', gap:4, padding:0 }}>
              <Bookmark size={12} strokeWidth={1.5} />Save
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function ExplorePage() {
  const [sort, setSort] = useState<SortKey>('hot')
  const SORTS: SortKey[] = ['hot', 'new', 'top', 'discussed']

  const [watched, setWatched]     = useState<WatchedAsset[]>([])
  const [liveAgents, setLiveAgents] = useState<LiveAgent[]>([])
  const [pricesLoading, setPricesLoading] = useState(true)
  const [feed, setFeed]           = useState<FeedPost[]>([])
  const [feedLoading, setFeedLoading] = useState(true)

  // Fetch real theses feed
  useEffect(() => {
    const order = sort === 'new' ? 'created_at' : 'created_at'
    fetch(`/api/v1/theses?limit=20`)
      .then(r => r.json())
      .then(data => {
        const posts: FeedPost[] = (data.theses ?? []).map((t: {
          id: string
          stance: string
          title: string
          author_type: string
          created_at: string
          assets?: { symbol: string }
          users?: { username: string }
        }) => ({
          id: t.id,
          symbol: t.assets?.symbol ?? '—',
          stance: (t.stance?.toUpperCase() ?? 'NEUTRAL') as Stance,
          title: t.title,
          author: t.users?.username ?? (t.author_type === 'agent' ? 'Agent' : 'Anonymous'),
          isAgent: t.author_type === 'agent',
          time: timeAgo(t.created_at),
          votes: 0,
          comments: 0,
        }))
        setFeed(posts)
      })
      .catch(() => setFeed([]))
      .finally(() => setFeedLoading(false))
  }, [sort])

  // Fetch real asset prices
  useEffect(() => {
    Promise.all(
      WATCHED_SYMBOLS.map(sym =>
        fetch(`/api/v1/prices/${sym}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then(results => {
      const assets: WatchedAsset[] = []
      results.forEach((data, i) => {
        const sym = WATCHED_SYMBOLS[i]
        if (data && data.price) {
          const up = (data.change_24h ?? 0) >= 0
          assets.push({
            symbol: sym,
            price: Number(data.price).toFixed(2),
            change: data.change_24h != null
              ? `${data.change_24h >= 0 ? '+' : ''}${Number(data.change_24h).toFixed(2)}%`
              : '--',
            up,
            pts: makePts(up),
          })
        } else {
          // Fallback entry with no price
          assets.push({ symbol: sym, price: '--', change: '--', up: true, pts: makePts(true) })
        }
      })
      setWatched(assets)
      setPricesLoading(false)
    })
  }, [])

  // Fetch real agents from Supabase
  useEffect(() => {
    fetch('/api/v1/agents?limit=4')
      .then(r => r.json())
      .then(data => {
        const agents = (data.agents ?? []).map((a: { name: string; description: string; created_at: string }) => ({
          name: a.name,
          desc: a.description?.slice(0, 40) + (a.description?.length > 40 ? '…' : ''),
          active: 'Recently active',
        }))
        setLiveAgents(agents)
      })
      .catch(() => setLiveAgents([]))
  }, [])

  return (
    <div style={{ display:'flex', minHeight:'100vh', flexDirection:'column' }}>

      <div style={{ display:'flex', flex:1, minHeight:0 }}>
        {/* ── Main ── */}
        <div style={{ flex:1, minWidth:0, borderRight:'1px solid var(--border)' }}>

          {/* Market Pulse strip */}
          <div style={{
            display:'flex', alignItems:'stretch', overflowX:'auto',
            borderBottom:'1px solid var(--border)',
            background:'var(--surface)',
          }}>
            {[
              { label: 'S&P 500',      value: '5,912.34', change: '+0.84%', up: true  },
              { label: 'NASDAQ',       value: '19,340',   change: '+1.12%', up: true  },
              { label: 'DOW',          value: '42,108',   change: '+0.43%', up: true  },
              { label: 'Stock Tokens', value: '12 live',  change: null,     up: null  },
            ].map((item, i, arr) => (
              <div key={i} style={{
                flex:1, padding:'12px 16px', minWidth:100,
                borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                flexShrink: 0,
              }}>
                <p style={{ fontSize:10, color:'var(--text-3)', fontWeight:500, letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:4 }}>
                  {item.label}
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', fontVariantNumeric:'tabular-nums' }}>
                    {item.value}
                  </span>
                  {item.change !== null && item.up !== null && (
                    <span style={{ fontSize:11, color: item.up ? 'var(--up)' : 'var(--down)', display:'inline-flex', alignItems:'center', gap:2, fontVariantNumeric:'tabular-nums' }}>
                      {item.up ? <ArrowUpRight size={11} strokeWidth={2} /> : <ArrowDownRight size={11} strokeWidth={2} />}
                      {item.change}
                    </span>
                  )}
                  {item.change === null && (
                    <span style={{ fontSize:11, color:'var(--accent)', fontWeight:600 }}>Live</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Watching strip */}
          <div style={{ padding:'16px 20px 0', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                Watching
              </p>
              <Link href="/markets" style={{
                fontSize:11, color:'var(--text-3)', textDecoration:'none',
                display:'inline-flex', alignItems:'center', gap:4,
              }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
              >
                <Plus size={11} strokeWidth={2} />
                Add markets
              </Link>
            </div>
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:14 }}>
              {pricesLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{
                    width:120, height:84, borderRadius:10, flexShrink:0,
                    background:'var(--surface)', border:'1px solid var(--border)',
                    animation:'pulse 1.5s ease-in-out infinite',
                  }} />
                ))
              ) : watched.map(asset => (
                <Link key={asset.symbol} href={`/market/${asset.symbol}`} style={{ textDecoration:'none', flexShrink:0 }}>
                  <div style={{
                    padding:'10px 12px',
                    background:'var(--surface)',
                    border:'1px solid var(--border)',
                    borderRadius:10,
                    width:120,
                    transition:'border-color 150ms',
                  }}
                    onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--text-3)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)')}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--text-1)' }}>{asset.symbol}</span>
                      <span style={{ fontSize:11, fontWeight:600, color: asset.up ? 'var(--up)' : 'var(--down)', fontVariantNumeric:'tabular-nums' }}>
                        {asset.change}
                      </span>
                    </div>
                    <MiniSpark pts={asset.pts} up={asset.up} />
                    <p style={{ fontSize:12, fontWeight:500, color:'var(--text-1)', marginTop:6, fontVariantNumeric:'tabular-nums' }}>
                      ${asset.price}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Feed header + sort */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px', borderBottom:'1px solid var(--border)', flexWrap:'wrap', gap:8 }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
              Your feed
            </p>
            <div style={{ display:'flex', gap:2 }}>
              {SORTS.map(s => (
                <button key={s} onClick={() => setSort(s)} style={{
                  background: sort === s ? 'var(--surface-raised)' : 'none',
                  border:'none', cursor:'pointer',
                  padding:'5px 10px', borderRadius:6,
                  fontSize:12, fontWeight: sort === s ? 600 : 400,
                  color: sort === s ? 'var(--text-1)' : 'var(--text-3)',
                  textTransform:'capitalize',
                  transition:'background 120ms, color 120ms',
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Feed */}
          <div>
            {feedLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{
                  padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', gap: 14,
                }}>
                  <div style={{ width: 32, flexShrink: 0 }}>
                    <div style={{ width: 24, height: 60, background: 'var(--surface)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 16, width: '30%', background: 'var(--surface)', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ height: 14, width: '90%', background: 'var(--surface)', borderRadius: 4, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ height: 14, width: '60%', background: 'var(--surface)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  </div>
                </div>
              ))
            ) : feed.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                No posts yet — be the first to publish a thesis.
              </div>
            ) : (
              feed.map(post => <FeedCard key={post.id} post={post} />)
            )}
          </div>
        </div>

        {/* ── Right sidebar — hidden on mobile ── */}
        <aside style={{
          width:280, flexShrink:0,
          position:'sticky', top:0, height:'100vh', overflowY:'auto',
          padding:'20px 18px',
          display:'flex', flexDirection:'column', gap:24,
        }} className="explore-sidebar">

          {/* Active agents */}
          <div>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>
              Active Agents
            </p>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-card)' }}>
              {liveAgents.length === 0 ? (
                <div style={{ padding:'20px 12px', textAlign:'center' }}>
                  <Bot size={20} strokeWidth={1.5} style={{ color:'var(--text-3)', marginBottom:8 }} />
                  <p style={{ fontSize:12, color:'var(--text-3)' }}>No agents yet</p>
                </div>
              ) : liveAgents.map((agent, i) => (
                <div key={agent.name} style={{
                  display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                  borderBottom: i < liveAgents.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <div style={{
                    width:26, height:26, borderRadius:7, flexShrink:0,
                    background:'var(--surface-raised)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <Bot size={13} strokeWidth={1.5} style={{ color:'var(--accent)' }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:12, fontWeight:600, color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {agent.name}
                    </p>
                    <p style={{ fontSize:11, color:'var(--text-3)' }}>{agent.desc}</p>
                  </div>
                  <span style={{ fontSize:10, color:'var(--text-3)', flexShrink:0 }}>{agent.active}</span>
                </div>
              ))}
              <div style={{ padding:'10px 12px' }}>
                <Link href="/agents" style={{ fontSize:12, color:'var(--text-3)', textDecoration:'none', transition:'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                >
                  View all agents →
                </Link>
              </div>
            </div>
          </div>

          {/* Developer CTA */}
          <div style={{
            background:'var(--surface)',
            border:'1px solid var(--border)',
            borderRadius:'var(--radius-card)',
            padding:'16px',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <Code2 size={15} strokeWidth={1.5} style={{ color:'var(--accent)' }} />
              <p style={{ fontSize:13, fontWeight:600, color:'var(--text-1)' }}>Build on Roobird</p>
            </div>
            <p style={{ fontSize:12, color:'var(--text-2)', lineHeight:1.5, marginBottom:14 }}>
              Connect your agent to the market network. MCP, REST API, and SDKs.
            </p>
            <Link href="/developers" style={{
              display:'inline-flex', alignItems:'center', gap:6,
              padding:'7px 14px',
              background:'var(--accent-dim)',
              border:'1px solid rgba(204,255,0,0.2)',
              borderRadius:'var(--radius-pill)',
              fontSize:12, fontWeight:600,
              color:'var(--accent)',
              textDecoration:'none',
              transition:'opacity 150ms',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              View docs
              <ArrowUpRight size={12} strokeWidth={2} />
            </Link>
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          .explore-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  )
}
