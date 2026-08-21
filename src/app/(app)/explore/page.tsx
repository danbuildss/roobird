'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
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
  Zap,
  Radio,
} from 'lucide-react'

type SortKey  = 'hot' | 'new' | 'top' | 'discussed'
type Stance   = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'RESEARCH' | 'QUESTION'

interface PriceData {
  price: number
  change_24h: number | null
  bid?: number
  ask?: number
}

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

interface PulseItem {
  symbol: string
  sentiment: 'Bullish' | 'Neutral' | 'Bearish'
  sentiment_score: number
  summary: string
  themes: string[]
  updated_at: string
}

interface LiveAgent {
  name: string
  desc: string
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

const SENTIMENT_COLOR: Record<PulseItem['sentiment'], string> = {
  Bullish: '#4ade80',
  Bearish: '#f87171',
  Neutral: '#94918d',
}

// Fallback watchlist when user has no bookmarks
const DEFAULT_WATCH = ['NVDA', 'HOOD', 'TSLA', 'META', 'AAPL', 'COIN']

// Full pool for Moving Now and price fetching
const PULSE_SYMBOLS = [
  'AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'META',
  'HOOD', 'COIN', 'AMD', 'INTC', 'NFLX', 'DIS', 'PYPL',
  'PLTR', 'RBLX', 'SNAP', 'UBER', 'LYFT', 'SQ',
]

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

  const [priceMap, setPriceMap]           = useState<Record<string, PriceData>>({})
  const [pricesLoading, setPricesLoading] = useState(true)
  const [watchedSymbols, setWatchedSymbols] = useState<string[]>(DEFAULT_WATCH)
  const [pulseList, setPulseList]         = useState<PulseItem[]>([])
  const [pulseLoading, setPulseLoading]   = useState(true)
  const [liveAgents, setLiveAgents]       = useState<LiveAgent[]>([])
  const [feed, setFeed]                   = useState<FeedPost[]>([])
  const [feedLoading, setFeedLoading]     = useState(true)
  const [addMarketOpen, setAddMarketOpen] = useState(false)
  const [addingSymbol, setAddingSymbol]   = useState<string | null>(null)
  const addMarketRef = useRef<HTMLDivElement>(null)

  // Close add-market popover on outside click
  useEffect(() => {
    if (!addMarketOpen) return
    const handler = (e: MouseEvent) => {
      if (addMarketRef.current && !addMarketRef.current.contains(e.target as Node)) {
        setAddMarketOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [addMarketOpen])

  const addMarket = useCallback(async (sym: string) => {
    if (addingSymbol) return
    setAddingSymbol(sym)
    try {
      const assetRes = await fetch(`/api/v1/assets/${sym}`)
      const assetJson = await assetRes.json()
      const asset_id = assetJson.data?.id
      if (!asset_id) return
      const res = await fetch('/api/v1/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: 'asset', target_id: asset_id }),
      })
      if (res.ok) {
        setWatchedSymbols(prev => prev.includes(sym) ? prev : [...prev, sym])
        setAddMarketOpen(false)
      }
    } catch {
      // silently ignore
    } finally {
      setAddingSymbol(null)
    }
  }, [addingSymbol])

  // Fetch prices for all PULSE_SYMBOLS in parallel
  useEffect(() => {
    Promise.allSettled(
      PULSE_SYMBOLS.map(sym =>
        fetch(`/api/v1/prices/${sym}`)
          .then(async r => {
            if (!r.ok) return null
            const j = await r.json()
            return j.data ? { sym, data: j.data as PriceData } : null
          })
          .catch(() => null)
      )
    ).then(results => {
      const map: Record<string, PriceData> = {}
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value) {
          map[r.value.sym] = r.value.data
        }
      })
      setPriceMap(map)
      setPricesLoading(false)
    })
  }, [])

  // Fetch bookmarked assets (list mode) — override default watchlist if user has bookmarks
  useEffect(() => {
    fetch('/api/v1/bookmarks?target_type=asset')
      .then(r => r.json())
      .then(data => {
        const assets: { symbol: string }[] = data.data?.assets ?? []
        if (assets.length > 0) {
          setWatchedSymbols(assets.map(a => a.symbol))
        }
      })
      .catch(() => {})
  }, [])

  // Fetch pulse list (Market Pulse Discovery)
  useEffect(() => {
    fetch('/api/v1/pulse?limit=6')
      .then(r => r.json())
      .then(data => setPulseList(data.data ?? []))
      .catch(() => setPulseList([]))
      .finally(() => setPulseLoading(false))
  }, [])

  // Fetch theses feed (Discussions)
  useEffect(() => {
    fetch(`/api/v1/theses?limit=20`)
      .then(r => r.json())
      .then(data => {
        const theses = data.data?.theses ?? []
        const posts: FeedPost[] = theses.map((t: {
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

  // Fetch agents for sidebar
  useEffect(() => {
    fetch('/api/v1/agents?limit=4')
      .then(r => r.json())
      .then(data => {
        const agents = (data.data?.agents ?? []).map((a: { name: string; description: string }) => ({
          name: a.name,
          desc: a.description?.slice(0, 40) + (a.description?.length > 40 ? '…' : ''),
        }))
        setLiveAgents(agents)
      })
      .catch(() => setLiveAgents([]))
  }, [])

  // Derive top movers (Moving Now) — sorted by abs(change_24h)
  const movers = useMemo(() => {
    return Object.entries(priceMap)
      .filter(([, d]) => d.change_24h != null)
      .sort((a, b) => Math.abs(b[1].change_24h!) - Math.abs(a[1].change_24h!))
      .slice(0, 4)
      .map(([symbol, d]) => ({ symbol, ...d }))
  }, [priceMap])

  // Derive watched assets with price data
  const watched = useMemo(() => {
    return watchedSymbols
      .filter(sym => priceMap[sym])
      .map(sym => {
        const d = priceMap[sym]
        const up = (d.change_24h ?? 0) >= 0
        return {
          symbol: sym,
          price: Number(d.price).toFixed(2),
          change: d.change_24h != null
            ? `${d.change_24h >= 0 ? '+' : ''}${Number(d.change_24h).toFixed(2)}%`
            : '—',
          up,
          pts: makePts(up),
        }
      })
  }, [watchedSymbols, priceMap])

  const liveCount = Object.keys(priceMap).length

  return (
    <div style={{ display:'flex', minHeight:'100vh', flexDirection:'column' }}>
      <div style={{ display:'flex', flex:1, minHeight:0 }}>

        {/* ── Main column ── */}
        <div style={{ flex:1, minWidth:0, borderRight:'1px solid var(--border)' }}>

          {/* Moving Now strip */}
          <div style={{
            display:'flex', alignItems:'stretch', overflowX:'auto',
            borderBottom:'1px solid var(--border)',
            background:'var(--surface)',
          }}>
            {/* Stock Tokens count cell */}
            <div style={{
              flex:1, padding:'12px 16px', minWidth:110,
              borderRight:'1px solid var(--border)', flexShrink:0,
            }}>
              <p style={{ fontSize:10, color:'var(--text-3)', fontWeight:500, letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:4 }}>
                Stock Tokens
              </p>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', fontVariantNumeric:'tabular-nums' }}>
                  {pricesLoading ? '—' : `${liveCount} live`}
                </span>
                {!pricesLoading && liveCount > 0 && (
                  <span style={{ fontSize:10, color:'var(--accent)', fontWeight:700 }}>●</span>
                )}
              </div>
            </div>

            {/* Moving Now: top movers */}
            {pricesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{
                  flex:1, padding:'12px 16px', minWidth:100,
                  borderRight:'1px solid var(--border)', flexShrink:0,
                }}>
                  <div style={{ height:10, width:40, background:'var(--surface-raised)', borderRadius:3, marginBottom:6, animation:'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ height:14, width:60, background:'var(--surface-raised)', borderRadius:3, animation:'pulse 1.5s ease-in-out infinite' }} />
                </div>
              ))
            ) : movers.map((m, i, arr) => {
              const up = (m.change_24h ?? 0) >= 0
              return (
                <Link key={m.symbol} href={`/market/${m.symbol}`} style={{ textDecoration:'none', flex:1, flexShrink:0 }}>
                  <div style={{
                    padding:'12px 16px', minWidth:100, height:'100%',
                    borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor:'pointer', transition:'background 120ms',
                  }}
                    onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'var(--surface-raised)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                      <p style={{ fontSize:10, color:'var(--text-3)', fontWeight:500, letterSpacing:'0.04em', textTransform:'uppercase' }}>
                        {m.symbol}
                      </p>
                      <span style={{ fontSize:9, color:'var(--text-3)', opacity:0.5 }}>
                        <Zap size={9} strokeWidth={2} style={{ color: up ? 'var(--up)' : 'var(--down)' }} />
                      </span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', fontVariantNumeric:'tabular-nums' }}>
                        ${Number(m.price).toFixed(2)}
                      </span>
                      {m.change_24h != null && (
                        <span style={{ fontSize:11, color: up ? 'var(--up)' : 'var(--down)', display:'inline-flex', alignItems:'center', gap:2, fontVariantNumeric:'tabular-nums' }}>
                          {up ? <ArrowUpRight size={11} strokeWidth={2} /> : <ArrowDownRight size={11} strokeWidth={2} />}
                          {Math.abs(m.change_24h).toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Watching */}
          <div style={{ padding:'16px 20px 0', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                Watching
              </p>
              <div ref={addMarketRef} style={{ position:'relative' }}>
                <button
                  onClick={() => setAddMarketOpen(o => !o)}
                  style={{
                    background:'none', border:'none', cursor:'pointer', padding:0,
                    fontSize:11, color:'var(--text-3)',
                    display:'inline-flex', alignItems:'center', gap:4,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                >
                  <Plus size={11} strokeWidth={2} />
                  Add markets
                </button>
                {addMarketOpen && (() => {
                  const available = PULSE_SYMBOLS.filter(s => !watchedSymbols.includes(s))
                  return (
                    <div style={{
                      position:'absolute', right:0, top:'calc(100% + 6px)', zIndex:100,
                      background:'var(--surface)', border:'1px solid var(--border)',
                      borderRadius:10, boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
                      minWidth:160, padding:'6px 0', overflow:'hidden',
                    }}>
                      {available.length === 0 ? (
                        <p style={{ fontSize:12, color:'var(--text-3)', padding:'8px 14px' }}>
                          All markets added
                        </p>
                      ) : available.map(sym => (
                        <button
                          key={sym}
                          disabled={addingSymbol === sym}
                          onClick={() => addMarket(sym)}
                          style={{
                            width:'100%', background:'none', border:'none', cursor:'pointer',
                            padding:'7px 14px', fontSize:13, fontWeight:600,
                            color:'var(--text-1)', textAlign:'left',
                            opacity: addingSymbol === sym ? 0.5 : 1,
                            transition:'background 100ms',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          {addingSymbol === sym ? '…' : sym}
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </div>
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
              ) : watched.length === 0 ? (
                <p style={{ fontSize:13, color:'var(--text-3)', paddingBottom:14 }}>
                  No watchlist yet — bookmark assets to see them here.
                </p>
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

          {/* Market Pulse Discovery (hidden if no fresh data) */}
          {!pulseLoading && pulseList.length > 0 && (
            <div style={{ padding:'16px 20px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <Radio size={13} strokeWidth={1.5} style={{ color:'var(--accent)' }} />
                <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                  Market Pulse
                </p>
                <span style={{ fontSize:10, color:'var(--text-3)', marginLeft:2 }}>via Grok + X</span>
              </div>
              <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:16 }}>
                {pulseList.map(item => {
                  const sc = SENTIMENT_COLOR[item.sentiment]
                  return (
                    <Link key={item.symbol} href={`/market/${item.symbol}`} style={{ textDecoration:'none', flexShrink:0 }}>
                      <div style={{
                        width:200, padding:'12px 14px',
                        background:'var(--surface)', border:'1px solid var(--border)',
                        borderRadius:12, transition:'border-color 150ms, background 150ms',
                      }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLDivElement
                          el.style.borderColor = 'var(--text-3)'
                          el.style.background = 'var(--surface-raised)'
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLDivElement
                          el.style.borderColor = 'var(--border)'
                          el.style.background = 'var(--surface)'
                        }}
                      >
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:'var(--text-1)' }}>
                            {item.symbol}
                          </span>
                          <span style={{
                            fontSize:10, fontWeight:700, letterSpacing:'0.05em',
                            color: sc, background:`${sc}18`,
                            padding:'2px 7px', borderRadius:'var(--radius-badge)',
                          }}>
                            {item.sentiment.toUpperCase()}
                          </span>
                        </div>
                        <p style={{
                          fontSize:12, color:'var(--text-2)', lineHeight:1.45,
                          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                          overflow:'hidden', marginBottom:8,
                        }}>
                          {item.summary}
                        </p>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {item.themes.slice(0, 2).map(t => (
                            <span key={t} style={{
                              fontSize:10, color:'var(--text-3)',
                              background:'var(--surface-raised)',
                              padding:'2px 6px', borderRadius:4,
                            }}>
                              {t}
                            </span>
                          ))}
                        </div>
                        <p style={{ fontSize:10, color:'var(--text-3)', marginTop:8 }}>
                          {timeAgo(item.updated_at)} ago
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Discussions header + sort */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px', borderBottom:'1px solid var(--border)', flexWrap:'wrap', gap:8 }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
              Discussions
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
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <TrendingUp size={28} strokeWidth={1.5} style={{ color: 'var(--text-3)', marginBottom: 12, opacity: 0.4 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                  No discussions yet
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 300, margin: '0 auto' }}>
                  Be the first to share a bullish or bearish thesis on a Stock Token.
                </p>
              </div>
            ) : (
              feed.map(post => <FeedCard key={post.id} post={post} />)
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
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
