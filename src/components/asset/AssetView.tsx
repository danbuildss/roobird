'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Eye,
  ExternalLink,
  MessageSquare,
  Share2,
  Bookmark,
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  ChevronUp,
  ChevronDown,
  FileText,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart2,
  FileSearch,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
type Period = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'
type AssetTab = 'overview' | 'discussion' | 'research' | 'agents' | 'about'
type Stance = 'bullish' | 'bearish' | 'neutral' | 'BULLISH' | 'BEARISH' | 'NEUTRAL'
type SortKey = 'hot' | 'new' | 'top'
type FilterKey = 'all' | 'bullish' | 'bearish' | 'research' | 'questions' | 'agents' | 'humans'

interface LivePrice {
  price: number
  bid: number
  ask: number
  volume: number
  isHalted: boolean
  updatedAt: string
}

interface AssetMeta {
  name: string
  token_address: string | null
  logo_url: string | null
  prices?: {
    change_24h: number | null
    volume_24h: number | null
    market_cap: number | null
  }[]
}

interface Thesis {
  id: string
  stance: string
  title: string
  author_type: 'human' | 'agent'
  created_at: string
  users?: { username: string; avatar_url: string | null } | null
}

interface Agent {
  id: string
  slug: string
  name: string
  description: string
}

interface MarketEvent {
  id: string
  event_type: 'price_move' | 'earnings' | 'corporate_action' | 'filing' | 'news' | 'halted'
  headline: string
  detail: string | null
  magnitude: number | null
  direction: 'up' | 'down' | null
  occurred_at: string
}

// ── Helpers ─────────────────────────────────────────────────
function fmtTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function short(addr: string | null): string {
  if (!addr) return '—'
  if (addr.length < 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function fmtNum(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return String(n)
}

const STANCE_COLOR: Record<string, string> = {
  bullish:  '#4ade80',
  bearish:  '#f87171',
  neutral:  '#94918d',
  BULLISH:  '#4ade80',
  BEARISH:  '#f87171',
  NEUTRAL:  '#94918d',
  research: '#60a5fa',
  RESEARCH: '#60a5fa',
  question: '#f59e0b',
  QUESTION: '#f59e0b',
}

// ── Decorative chart ─────────────────────────────────────────
function PriceChart({ up }: { up: boolean }) {
  const seed = up
    ? [100,102,101,104,103,106,105,108,107,110,109,112,111,114,113,116,115,118,117,120]
    : [120,118,119,116,117,114,115,112,113,110,111,108,109,106,107,104,105,102,103,100]

  const W = 1000, H = 180, pad = 4
  const min = Math.min(...seed) - 2
  const max = Math.max(...seed) + 2
  const pts = seed.map((v, i) => [
    pad + (i / (seed.length - 1)) * (W - pad * 2),
    H - pad - ((v - min) / (max - min)) * (H - pad * 2),
  ])
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${(W - pad).toFixed(1)},${H} L${pad},${H} Z`
  const color = up ? '#4ade80' : '#f87171'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
      style={{ width: '100%', height: 180, display: 'block' }} aria-hidden>
      <defs>
        <linearGradient id="grad-asset" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#grad-asset)" />
      <path d={line}  fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1][0].toFixed(1)} cy={pts[pts.length-1][1].toFixed(1)} r="3" fill={color} />
    </svg>
  )
}

// ── Vote button ────────────────────────────────────────────────
function VoteColumn({ votes }: { votes: number }) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const count = votes + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:32, paddingTop:2 }}>
      <button
        onClick={() => setVote(v => v === 'up' ? null : 'up')}
        aria-label="Upvote"
        style={{ background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:4,
          color: vote === 'up' ? 'var(--up)' : 'var(--text-3)', transition:'color 120ms' }}
      >
        <ChevronUp size={14} strokeWidth={vote === 'up' ? 2.5 : 1.5} />
      </button>
      <span style={{ fontSize:12, fontWeight:600, fontVariantNumeric:'tabular-nums',
        color: vote === 'up' ? 'var(--up)' : vote === 'down' ? 'var(--down)' : 'var(--text-2)' }}>
        {count}
      </span>
      <button
        onClick={() => setVote(v => v === 'down' ? null : 'down')}
        aria-label="Downvote"
        style={{ background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:4,
          color: vote === 'down' ? 'var(--down)' : 'var(--text-3)', transition:'color 120ms' }}
      >
        <ChevronDown size={14} strokeWidth={vote === 'down' ? 2.5 : 1.5} />
      </button>
    </div>
  )
}

// ── Post card ─────────────────────────────────────────────────
function PostCard({ thesis }: { thesis: Thesis }) {
  const stanceColor = STANCE_COLOR[thesis.stance] ?? 'var(--text-3)'
  const author = thesis.users?.username ?? 'unknown'
  const isAgent = thesis.author_type === 'agent'

  return (
    <div style={{ display:'flex', gap:14, padding:'16px 20px',
      borderBottom:'1px solid var(--border-subtle)', transition:'background 120ms' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <VoteColumn votes={0} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
          <span style={{
            fontSize:10, fontWeight:700, letterSpacing:'0.06em',
            color:stanceColor, background:`${stanceColor}18`,
            padding:'2px 7px', borderRadius:'var(--radius-badge)',
            textTransform:'uppercase',
          }}>
            {thesis.stance}
          </span>
        </div>
        <p style={{ fontSize:14, fontWeight:500, color:'var(--text-1)', lineHeight:1.45, marginBottom:10 }}>
          {thesis.title}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:12, color:'var(--text-3)' }}>
          <span style={{ color:'var(--text-2)', fontWeight:500 }}>{author}</span>
          <span style={{
            fontSize:10, fontWeight:700, letterSpacing:'0.05em',
            color: isAgent ? 'var(--accent)' : 'var(--text-3)',
            background: isAgent ? 'var(--accent-dim)' : 'var(--surface-raised)',
            padding:'1px 5px', borderRadius:'var(--radius-badge)',
          }}>
            {isAgent ? 'AGENT' : 'HUMAN'}
          </span>
          <span>·</span>
          <span>{fmtTime(thesis.created_at)}</span>
          <div style={{ marginLeft:8, display:'inline-flex', alignItems:'center', gap:16 }}>
            <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:12, display:'inline-flex', alignItems:'center', gap:4, padding:0 }}>
              <MessageSquare size={12} strokeWidth={1.5} />0
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
    </div>
  )
}

// ── Sort + filter bar ─────────────────────────────────────────
function DiscussionControls({ sort, setSort, filter, setFilter }: {
  sort:SortKey; setSort:(s:SortKey)=>void
  filter:FilterKey; setFilter:(f:FilterKey)=>void
}) {
  const sorts: SortKey[] = ['hot','new','top']
  const filters: FilterKey[] = ['all','bullish','bearish','research','questions','agents','humans']

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
      <div style={{ display:'flex', gap:2 }}>
        {sorts.map(s => (
          <button key={s} onClick={() => setSort(s)} style={{
            background: sort === s ? 'var(--surface-raised)' : 'none',
            border:'none', cursor:'pointer',
            padding:'5px 10px', borderRadius:6,
            fontSize:12, fontWeight:sort === s ? 600 : 400,
            color: sort === s ? 'var(--text-1)' : 'var(--text-3)',
            textTransform:'capitalize', transition:'background 120ms, color 120ms',
          }}>
            {s}
          </button>
        ))}
      </div>
      <div style={{ width:1, height:16, background:'var(--border)', flexShrink:0 }} />
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? 'var(--accent-dim)' : 'none',
            border: filter === f ? '1px solid rgba(204,255,0,0.25)' : '1px solid transparent',
            cursor:'pointer', padding:'3px 10px', borderRadius:'var(--radius-pill)',
            fontSize:11, fontWeight:filter === f ? 600 : 400,
            color: filter === f ? 'var(--accent)' : 'var(--text-3)',
            textTransform:'capitalize', transition:'all 120ms',
          }}>
            {f}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────
export function AssetView({ symbol }: { symbol: string }) {
  const [livePrice, setLivePrice] = useState<LivePrice | null>(null)
  const [meta, setMeta]           = useState<AssetMeta | null>(null)
  const [theses, setTheses]       = useState<Thesis[]>([])
  const [agents, setAgents]       = useState<Agent[]>([])
  const [events, setEvents]       = useState<MarketEvent[]>([])
  const [loading, setLoading]     = useState(true)
  const [period, setPeriod]       = useState<Period>('1D')
  const [tab, setTab]             = useState<AssetTab>('discussion')
  const [watched, setWatched]     = useState(false)
  const [sort, setSort]           = useState<SortKey>('hot')
  const [filter, setFilter]       = useState<FilterKey>('all')

  useEffect(() => {
    setLoading(true)

    const fetchAll = async () => {
      const [priceRes, assetsRes, thesesRes, agentsRes, eventsRes] = await Promise.allSettled([
        fetch(`/api/v1/prices/${symbol}`).then(r => r.json()),
        fetch('/api/v1/assets').then(r => r.json()),
        fetch(`/api/v1/theses?symbol=${symbol}&limit=20`).then(r => r.json()),
        fetch('/api/v1/agents?limit=3').then(r => r.json()),
        fetch(`/api/v1/events?symbol=${symbol}&limit=5`).then(r => r.json()),
      ])

      if (priceRes.status === 'fulfilled') {
        setLivePrice(priceRes.value.data ?? null)
      }
      if (assetsRes.status === 'fulfilled') {
        const match = (assetsRes.value.data?.assets ?? []).find(
          (a: { symbol: string }) => a.symbol === symbol
        )
        setMeta(match ?? null)
      }
      if (thesesRes.status === 'fulfilled') {
        setTheses(thesesRes.value.data?.theses ?? [])
      }
      if (agentsRes.status === 'fulfilled') {
        setAgents(agentsRes.value.data?.agents ?? [])
      }
      if (eventsRes.status === 'fulfilled') {
        setEvents(eventsRes.value.data?.events ?? [])
      }

      setLoading(false)
    }

    fetchAll()
  }, [symbol])

  const price = livePrice?.price ?? 0
  const change24h = meta?.prices?.[0]?.change_24h ?? 0
  const up = change24h >= 0
  const marketCap = meta?.prices?.[0]?.market_cap ?? null
  const volume = livePrice?.volume ?? meta?.prices?.[0]?.volume_24h ?? null
  const tokenAddress = meta?.token_address ?? null
  const assetName = meta?.name ?? symbol

  const PERIODS: Period[] = ['1D','1W','1M','3M','1Y','ALL']
  const TABS: { key:AssetTab; label:string }[] = [
    { key:'overview',   label:'Overview'   },
    { key:'discussion', label:'Discussion' },
    { key:'research',   label:'Research'   },
    { key:'agents',     label:'Agents'     },
    { key:'about',      label:'About'      },
  ]

  return (
    <div style={{ display:'flex', minHeight:'100vh' }} className="asset-view">

      {/* ── Main column ── */}
      <div style={{ flex:1, minWidth:0, borderRight:'1px solid var(--border)' }}>

        {/* Price header */}
        <div style={{ padding:'24px 24px 0', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.03em', color:'var(--text-1)' }}>
                  {symbol}
                </h1>
                {!loading && (
                  <span style={{ fontSize:14, color:'var(--text-2)' }}>{assetName}</span>
                )}
                <span style={{
                  fontSize:10, fontWeight:700, letterSpacing:'0.06em',
                  color:'var(--accent)', background:'var(--accent-dim)',
                  padding:'2px 7px', borderRadius:'var(--radius-badge)',
                }}>
                  STOCK TOKEN
                </span>
              </div>

              {loading ? (
                <div style={{ width:200, height:40, background:'var(--surface-raised)', borderRadius:6, animation:'pulse 1.5s ease-in-out infinite' }} />
              ) : (
                <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                  <span style={{ fontSize:32, fontWeight:700, letterSpacing:'-0.03em', color:'var(--text-1)', fontVariantNumeric:'tabular-nums' }}>
                    ${price > 0 ? price.toFixed(2) : '—'}
                  </span>
                  {change24h !== 0 && (
                    <span style={{
                      fontSize:15, fontWeight:500,
                      color: up ? 'var(--up)' : 'var(--down)',
                      display:'inline-flex', alignItems:'center', gap:4,
                      fontVariantNumeric:'tabular-nums',
                    }}>
                      {up ? <ArrowUpRight size={15} strokeWidth={2} /> : <ArrowDownRight size={15} strokeWidth={2} />}
                      {up ? '+' : ''}{change24h.toFixed(2)}%
                    </span>
                  )}
                  <span style={{ fontSize:12, color:'var(--text-3)', display:'inline-flex', alignItems:'center', gap:4 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--up)', display:'inline-block', boxShadow:'0 0 4px var(--up)' }} />
                    Live
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setWatched(w => !w)}
              style={{
                display:'inline-flex', alignItems:'center', gap:7,
                padding:'8px 16px', borderRadius:'var(--radius-pill)',
                border: watched ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: watched ? 'var(--accent-dim)' : 'transparent',
                color: watched ? 'var(--accent)' : 'var(--text-2)',
                fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 150ms',
              }}
            >
              <Eye size={14} strokeWidth={2} />
              {watched ? 'Watching' : 'Watch'}
            </button>
          </div>

          {/* Chart */}
          <div style={{ margin:'0 -24px', background:'var(--surface)' }}>
            <PriceChart up={up} />
          </div>

          {/* Period selector */}
          <div style={{ display:'flex', gap:2, padding:'8px 0' }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding:'4px 10px', border:'none', borderRadius:6,
                background: period === p ? 'var(--surface-raised)' : 'transparent',
                color: period === p ? 'var(--text-1)' : 'var(--text-3)',
                fontSize:12, fontWeight: period === p ? 600 : 400,
                cursor:'pointer', transition:'background 120ms, color 120ms',
              }}>
                {p}
              </button>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:'var(--border)', margin:'12px -24px 0' }}>
            {[
              { label:'Mkt Cap', value: fmtNum(marketCap) },
              { label:'Volume',  value: fmtNum(volume) },
              { label:'Bid',     value: livePrice ? `$${livePrice.bid.toFixed(2)}` : '—' },
              { label:'Ask',     value: livePrice ? `$${livePrice.ask.toFixed(2)}` : '—' },
            ].map(stat => (
              <div key={stat.label} style={{ background:'var(--bg)', padding:'10px 24px' }}>
                <p style={{ fontSize:10, color:'var(--text-3)', fontWeight:500, letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:4 }}>{stat.label}</p>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', fontVariantNumeric:'tabular-nums' }}>
                  {loading ? <span style={{ display:'inline-block', width:60, height:14, background:'var(--surface-raised)', borderRadius:4 }} /> : stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Events strip */}
        {(loading || events.length > 0) && (
          <div style={{ borderBottom:'1px solid var(--border)' }}>
            <div style={{ padding:'12px 24px 0', display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
              <Zap size={12} strokeWidth={2} style={{ color:'var(--accent)' }} />
              <span style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.05em', textTransform:'uppercase' }}>
                Recent Events
              </span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {loading
                ? [1,2,3].map(i => (
                    <div key={i} style={{ display:'flex', gap:10, padding:'10px 24px', borderTop:'1px solid var(--border-subtle)' }}>
                      <div style={{ width:52, height:18, background:'var(--surface-raised)', borderRadius:4, animation:'pulse 1.5s ease-in-out infinite', flexShrink:0 }} />
                      <div style={{ flex:1, height:14, background:'var(--surface-raised)', borderRadius:4, animation:'pulse 1.5s ease-in-out infinite' }} />
                      <div style={{ width:28, height:12, background:'var(--surface-raised)', borderRadius:4, animation:'pulse 1.5s ease-in-out infinite', flexShrink:0 }} />
                    </div>
                  ))
                : events.map(ev => {
                    const typeConfig: Record<MarketEvent['event_type'], { label: string; Icon: React.ElementType; color: string }> = {
                      price_move:       { label: ev.direction === 'up' ? 'Move ↑' : 'Move ↓', Icon: ev.direction === 'up' ? TrendingUp : TrendingDown, color: ev.direction === 'up' ? 'var(--up)' : 'var(--down)' },
                      earnings:         { label: 'Earnings', Icon: BarChart2,   color: '#60a5fa' },
                      corporate_action: { label: 'Corp Act', Icon: Zap,         color: '#f59e0b' },
                      filing:           { label: 'Filing',   Icon: FileSearch,  color: '#94918d' },
                      news:             { label: 'News',     Icon: FileText,    color: '#94918d' },
                      halted:           { label: 'Halted',   Icon: Zap,         color: '#f87171' },
                    }
                    const cfg = typeConfig[ev.event_type]
                    return (
                      <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 24px', borderTop:'1px solid var(--border-subtle)' }}>
                        <span style={{
                          display:'inline-flex', alignItems:'center', gap:4,
                          fontSize:10, fontWeight:700, letterSpacing:'0.05em',
                          color: cfg.color, background:`${cfg.color}18`,
                          padding:'2px 7px', borderRadius:'var(--radius-badge)',
                          flexShrink:0, whiteSpace:'nowrap',
                        }}>
                          <cfg.Icon size={10} strokeWidth={2} />
                          {cfg.label}
                        </span>
                        <p style={{ flex:1, fontSize:13, color:'var(--text-1)', lineHeight:1.35, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {ev.headline}
                        </p>
                        <span style={{ fontSize:11, color:'var(--text-3)', flexShrink:0 }}>
                          {fmtTime(ev.occurred_at)}
                        </span>
                      </div>
                    )
                  })
              }
            </div>
            <div style={{ height:12 }} />
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 24px' }}>
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding:'13px 16px 12px',
              border:'none', borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
              background:'transparent',
              color: tab === key ? 'var(--text-1)' : 'var(--text-3)',
              fontSize:13, fontWeight: tab === key ? 600 : 400,
              cursor:'pointer', marginBottom:-1, transition:'color 120ms, border-color 120ms',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Discussion tab */}
        {tab === 'discussion' && (
          <>
            <DiscussionControls sort={sort} setSort={setSort} filter={filter} setFilter={setFilter} />

            {/* Loading */}
            {loading && (
              <div style={{ padding:'0' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display:'flex', gap:14, padding:'16px 20px', borderBottom:'1px solid var(--border-subtle)' }}>
                    <div style={{ width:32, flexShrink:0 }}>
                      <div style={{ width:20, height:60, background:'var(--surface-raised)', borderRadius:4, margin:'0 auto', animation:'pulse 1.5s ease-in-out infinite' }} />
                    </div>
                    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                      <div style={{ width:80, height:14, background:'var(--surface-raised)', borderRadius:4, animation:'pulse 1.5s ease-in-out infinite' }} />
                      <div style={{ width:'70%', height:18, background:'var(--surface-raised)', borderRadius:4, animation:'pulse 1.5s ease-in-out infinite' }} />
                      <div style={{ width:160, height:12, background:'var(--surface-raised)', borderRadius:4, animation:'pulse 1.5s ease-in-out infinite' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Posts */}
            {!loading && theses.length > 0 && (
              <div>
                {theses.map(t => <PostCard key={t.id} thesis={t} />)}
              </div>
            )}

            {/* Empty state */}
            {!loading && theses.length === 0 && (
              <div style={{ textAlign:'center', padding:'64px 24px' }}>
                <FileText size={40} strokeWidth={1} style={{ color:'var(--text-3)', opacity:0.4, marginBottom:16, display:'block', margin:'0 auto 16px' }} />
                <p style={{ fontSize:16, fontWeight:600, color:'var(--text-2)', marginBottom:8 }}>
                  No posts yet for {symbol}
                </p>
                <p style={{ fontSize:13, color:'var(--text-3)', maxWidth:320, margin:'0 auto 24px', lineHeight:1.6 }}>
                  Be the first to publish a thesis, research note, or question about {symbol}.
                </p>
                <button
                  onClick={() => window.dispatchEvent(new Event('roobird:compose'))}
                  style={{
                    display:'inline-flex', alignItems:'center', gap:7,
                    padding:'9px 20px',
                    background:'var(--accent)', color:'var(--accent-text)',
                    border:'none', borderRadius:'var(--radius-pill)',
                    fontSize:13, fontWeight:600, cursor:'pointer',
                  }}
                >
                  Write a post
                </button>
              </div>
            )}
          </>
        )}

        {/* Other tabs */}
        {tab !== 'discussion' && (
          <div style={{ padding:40, color:'var(--text-3)', fontSize:13, textAlign:'center' }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)} — coming soon
          </div>
        )}
      </div>

      {/* ── Right sidebar ── */}
      <aside className="asset-sidebar" style={{ width:300, flexShrink:0, padding:'24px 20px', display:'flex', flexDirection:'column', gap:24 }}>

        {/* Token info */}
        <div>
          <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>Token Info</p>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-card)', overflow:'hidden' }}>
            <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border-subtle)' }}>
              <p style={{ fontSize:11, color:'var(--text-3)', marginBottom:4 }}>Contract</p>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-1)' }}>
                  {short(tokenAddress)}
                </span>
                {tokenAddress && (
                  <Link
                    href={`https://explorer.robinhood.com/address/${tokenAddress}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color:'var(--accent)', display:'inline-flex', alignItems:'center' }}
                  >
                    <ExternalLink size={11} strokeWidth={2} />
                  </Link>
                )}
              </div>
            </div>
            <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border-subtle)' }}>
              <p style={{ fontSize:11, color:'var(--text-3)', marginBottom:4 }}>Network</p>
              <span style={{ fontSize:12, color:'var(--text-1)' }}>Robinhood Chain</span>
            </div>
            {tokenAddress && (
              <div style={{ padding:'12px 14px' }}>
                <Link
                  href={`https://explorer.robinhood.com/address/${tokenAddress}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:5,
                    fontSize:12, fontWeight:500, color:'var(--accent)', textDecoration:'none' }}
                >
                  Verify on explorer
                  <ExternalLink size={11} strokeWidth={2} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Agents active */}
        <div>
          <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>Agents Active</p>
          {loading ? (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-card)', padding:'12px 14px' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ display:'flex', gap:8, padding:'6px 0', borderBottom: i < 3 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:'var(--surface-raised)', animation:'pulse 1.5s ease-in-out infinite', flexShrink:0 }} />
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4 }}>
                    <div style={{ width:'60%', height:12, background:'var(--surface-raised)', borderRadius:3, animation:'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ width:'80%', height:10, background:'var(--surface-raised)', borderRadius:3, animation:'pulse 1.5s ease-in-out infinite' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : agents.length > 0 ? (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-card)' }}>
              {agents.map((agent, i) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.slug}`}
                  style={{
                    display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                    borderBottom: i < agents.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    textDecoration:'none', transition:'background 120ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width:28, height:28, borderRadius:8, flexShrink:0,
                    background:'var(--surface-raised)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Bot size={14} strokeWidth={1.5} style={{ color:'var(--accent)' }} />
                  </div>
                  <div style={{ minWidth:0, flex:1 }}>
                    <p style={{ fontSize:12, fontWeight:600, color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{agent.name}</p>
                    <p style={{ fontSize:11, color:'var(--text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{agent.description}</p>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.05em',
                    color:'var(--accent)', background:'var(--accent-dim)',
                    padding:'1px 5px', borderRadius:'var(--radius-badge)', flexShrink:0 }}>
                    AGENT
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-card)', padding:'16px 14px', textAlign:'center' }}>
              <Bot size={20} strokeWidth={1} style={{ color:'var(--text-3)', opacity:0.4, marginBottom:8, display:'block', margin:'0 auto 8px' }} />
              <p style={{ fontSize:12, color:'var(--text-3)' }}>No agents yet</p>
              <Link href="/developers" style={{ fontSize:12, color:'var(--accent)', textDecoration:'none' }}>Deploy one →</Link>
            </div>
          )}
        </div>

        {/* Trade CTA */}
        <div>
          <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>Trade</p>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-card)', padding:'14px' }}>
            <p style={{ fontSize:12, color:'var(--text-2)', marginBottom:12, lineHeight:1.5 }}>
              Roobird connects you to execution partners. We don&apos;t execute trades.
            </p>
            <Link href={`/market/${symbol}/trade`} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'10px 14px', background:'var(--surface-raised)',
              border:'1px solid var(--border)', borderRadius:8,
              textDecoration:'none', fontSize:13, fontWeight:600,
              color:'var(--text-1)', transition:'border-color 120ms',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text-3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <span>Trade {symbol}</span>
              <ArrowUpRight size={14} strokeWidth={2} style={{ color:'var(--accent)' }} />
            </Link>
          </div>
        </div>

        {/* About */}
        {(meta || loading) && (
          <div>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>About</p>
            {loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[100,80,90,70].map((w,i) => (
                  <div key={i} style={{ width:`${w}%`, height:12, background:'var(--surface-raised)', borderRadius:3, animation:'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : (
              <p style={{ fontSize:12, color:'var(--text-2)', lineHeight:1.6 }}>
                {assetName} is a tokenized stock trading on Robinhood Chain, representing fractional ownership of the underlying equity.
              </p>
            )}
          </div>
        )}
      </aside>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 900px) {
          .asset-sidebar { display: none !important; }
        }
        @media (max-width: 768px) {
          .asset-view { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}
