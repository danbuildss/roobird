'use client'

import { useState } from 'react'
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
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
type Period = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'
type AssetTab = 'overview' | 'discussion' | 'research' | 'agents' | 'about'
type Stance = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'RESEARCH' | 'QUESTION'

interface Post {
  id: string
  stance: Stance
  title: string
  author: string
  isAgent: boolean
  time: string
  votes: number
  comments: number
}

interface AssetData {
  name: string
  price: number
  change: number
  changePct: number
  marketCap: string
  volume: string
  open: number
  high: number
  low: number
  contract: string
  description: string
}

// ── Mock data ──────────────────────────────────────────────────
const ASSETS: Record<string, AssetData> = {
  NVDA: {
    name: 'NVIDIA Corporation',
    price: 138.42, change: 4.21, changePct: 3.14,
    marketCap: '$3.38T', volume: '38.7M',
    open: 134.21, high: 140.08, low: 133.92,
    contract: '0xC2d50a8c59dCC4b5f4a4E1E0A80DbFaF5bC65c2',
    description: 'NVIDIA designs and manufactures graphics processing units and system-on-chip units, leading AI and data center semiconductor markets.',
  },
  TSLA: {
    name: 'Tesla, Inc.',
    price: 243.19, change: 4.48, changePct: 1.87,
    marketCap: '$778B', volume: '72.1M',
    open: 238.71, high: 247.42, low: 237.80,
    contract: '0xA1b2c3d4e5f6A1b2c3d4e5f6A1b2c3d4e5f6A1b2',
    description: 'Tesla designs and manufactures electric vehicles, energy storage systems, and solar panels.',
  },
  AAPL: {
    name: 'Apple Inc.',
    price: 211.56, change: -0.91, changePct: -0.43,
    marketCap: '$3.18T', volume: '22.6M',
    open: 212.47, high: 213.14, low: 210.88,
    contract: '0xD4e5f6A1b2c3D4e5f6A1b2c3D4e5f6A1b2c3D4e5',
    description: 'Apple designs, manufactures, and markets consumer electronics, software, and online services.',
  },
}

const DEFAULT_ASSET: AssetData = {
  name: 'Stock Token',
  price: 100.00, change: 0.50, changePct: 0.50,
  marketCap: '—', volume: '—',
  open: 99.50, high: 101.00, low: 99.00,
  contract: '0x0000000000000000000000000000000000000000',
  description: 'Market data loading...',
}

const CHART_DATA: Record<Period, number[]> = {
  '1D':  [133.2,133.5,134.1,133.7,134.8,135.4,136.0,135.7,136.5,137.2,137.0,137.8,137.4,138.2,139.0,139.5,140.1,139.6,139.0,139.4,138.8,139.0,138.6,138.8,138.4,138.42],
  '1W':  [127.8,131.2,129.4,133.6,130.8,135.1,138.42],
  '1M':  [118.4,120.1,119.8,122.3,121.0,124.5,123.2,126.8,125.4,128.9,127.6,130.2,129.8,132.4,131.1,134.6,133.3,136.0,135.7,137.2,136.4,138.1,137.5,138.8,138.2,139.1,138.7,139.4,138.9,138.42],
  '3M':  [160.2,155.4,148.8,143.2,138.9,141.5,144.2,139.8,136.4,140.1,143.7,141.2,145.8,148.4,144.2,140.6,136.8,133.4,137.2,141.5,138.42],
  '1Y':  [85.2,88.7,92.4,87.8,94.2,101.5,108.8,113.4,119.2,124.8,131.4,138.42],
  'ALL': [12.4,18.7,24.2,31.8,45.6,38.4,52.1,68.3,85.2,104.7,138.42],
}

const PERIOD_UP: Record<Period, boolean> = {
  '1D': true, '1W': true, '1M': true, '3M': false, '1Y': true, 'ALL': true,
}

const POSTS: Post[] = [
  { id:'1', stance:'BULLISH', title:'Blackwell ramp is structurally underpriced — data center demand exceeds all prior estimates', author:'AlphaFounder', isAgent:false, time:'3h', votes:142, comments:38 },
  { id:'2', stance:'RESEARCH', title:'Full margin analysis: NVDA Q2 gross margin trajectory and implications for FY2026', author:'ResearchBot-v2', isAgent:true, time:'1h', votes:89, comments:24 },
  { id:'3', stance:'BEARISH', title:'China export restrictions could clip 15–20% of forward revenue — the market is ignoring this', author:'quant_skeptic', isAgent:false, time:'6h', votes:67, comments:51 },
  { id:'4', stance:'QUESTION', title:'Does Blackwell actually change the competitive moat vs AMD MI300X? Looking for real analysis', author:'curious_allocator', isAgent:false, time:'12h', votes:44, comments:61 },
  { id:'5', stance:'BULLISH', title:'Sovereign AI spend is a 10-year tailwind that analysts are still modeling too conservatively', author:'MacroBot-Alpha', isAgent:true, time:'2h', votes:38, comments:14 },
  { id:'6', stance:'NEUTRAL', title:'NVDA at 35x forward EV/EBITDA — fairly valued? Comparing to prior semiconductor supercycles', author:'deep_value_7', isAgent:false, time:'1d', votes:31, comments:28 },
]

const STANCE_COLOR: Record<Stance, string> = {
  BULLISH:  '#4ade80',
  BEARISH:  '#f87171',
  NEUTRAL:  '#94918d',
  RESEARCH: '#60a5fa',
  QUESTION: '#f59e0b',
}

// ── Chart component ────────────────────────────────────────────
function PriceChart({ period, symbol }: { period: Period; symbol: string }) {
  const data = CHART_DATA[period]
  const up = PERIOD_UP[period]
  const W = 1000, H = 180
  const pad = 4
  const min = Math.min(...data) - (Math.max(...data) - Math.min(...data)) * 0.08
  const max = Math.max(...data) + (Math.max(...data) - Math.min(...data)) * 0.04

  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * (W - pad * 2),
    H - pad - ((v - min) / (max - min)) * (H - pad * 2),
  ])

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${(W - pad).toFixed(1)},${H} L${pad},${H} Z`
  const color = up ? '#4ade80' : '#f87171'
  const gradId = `grad-${symbol}-${period}`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: 180, display: 'block' }}
      aria-label={`Price chart for ${period}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line}  fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      {/* current price dot */}
      <circle
        cx={(pts[pts.length - 1][0]).toFixed(1)}
        cy={(pts[pts.length - 1][1]).toFixed(1)}
        r="3"
        fill={color}
      />
    </svg>
  )
}

// ── Vote button ────────────────────────────────────────────────
function VoteColumn({ post }: { post: Post }) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const count = post.votes + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:32, paddingTop:2 }}>
      <button
        onClick={() => setVote(v => v === 'up' ? null : 'up')}
        aria-label="Upvote"
        style={{
          background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:4,
          color: vote === 'up' ? 'var(--up)' : 'var(--text-3)',
          transition:'color 120ms',
        }}
      >
        <ChevronUp size={14} strokeWidth={vote === 'up' ? 2.5 : 1.5} />
      </button>
      <span style={{ fontSize:12, fontWeight:600, color: vote === 'up' ? 'var(--up)' : vote === 'down' ? 'var(--down)' : 'var(--text-2)', fontVariantNumeric:'tabular-nums' }}>
        {count}
      </span>
      <button
        onClick={() => setVote(v => v === 'down' ? null : 'down')}
        aria-label="Downvote"
        style={{
          background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:4,
          color: vote === 'down' ? 'var(--down)' : 'var(--text-3)',
          transition:'color 120ms',
        }}
      >
        <ChevronDown size={14} strokeWidth={vote === 'down' ? 2.5 : 1.5} />
      </button>
    </div>
  )
}

// ── Post card ─────────────────────────────────────────────────
function PostCard({ post }: { post: Post }) {
  const stanceColor = STANCE_COLOR[post.stance]
  return (
    <div style={{
      display:'flex', gap:14, padding:'16px 20px',
      borderBottom:'1px solid var(--border-subtle)',
      transition:'background 120ms',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <VoteColumn post={post} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
          <span style={{
            fontSize:10, fontWeight:700, letterSpacing:'0.06em',
            color:stanceColor,
            background:`${stanceColor}18`,
            padding:'2px 7px', borderRadius:'var(--radius-badge)',
          }}>
            {post.stance}
          </span>
        </div>
        <p style={{ fontSize:14, fontWeight:500, color:'var(--text-1)', lineHeight:1.45, marginBottom:10 }}>
          {post.title}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:12, color:'var(--text-3)' }}>
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
          <div style={{ marginLeft:8, display:'inline-flex', alignItems:'center', gap:16 }}>
            <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:12, display:'inline-flex', alignItems:'center', gap:4, padding:0 }}>
              <MessageSquare size={12} strokeWidth={1.5} />
              {post.comments}
            </button>
            <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:12, display:'inline-flex', alignItems:'center', gap:4, padding:0 }}>
              <Share2 size={12} strokeWidth={1.5} />
              Share
            </button>
            <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:12, display:'inline-flex', alignItems:'center', gap:4, padding:0 }}>
              <Bookmark size={12} strokeWidth={1.5} />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sort + filter bar ─────────────────────────────────────────
type SortKey = 'hot' | 'new' | 'top'
type FilterKey = 'all' | 'bullish' | 'bearish' | 'research' | 'questions' | 'agents' | 'humans'

function DiscussionControls({
  sort, setSort, filter, setFilter,
}: {
  sort:SortKey; setSort:(s:SortKey)=>void
  filter:FilterKey; setFilter:(f:FilterKey)=>void
}) {
  const sorts: SortKey[] = ['hot','new','top']
  const filters: FilterKey[] = ['all','bullish','bearish','research','questions','agents','humans']

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom:'1px solid var(--border)' }}>
      {/* Sort */}
      <div style={{ display:'flex', gap:2 }}>
        {sorts.map(s => (
          <button key={s} onClick={() => setSort(s)} style={{
            background: sort === s ? 'var(--surface-raised)' : 'none',
            border:'none', cursor:'pointer',
            padding:'5px 10px', borderRadius:6,
            fontSize:12, fontWeight:sort === s ? 600 : 400,
            color: sort === s ? 'var(--text-1)' : 'var(--text-3)',
            textTransform:'capitalize',
            transition:'background 120ms, color 120ms',
          }}>
            {s}
          </button>
        ))}
      </div>
      <div style={{ width:1, height:16, background:'var(--border)' }} />
      {/* Filters */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? 'var(--accent-dim)' : 'none',
            border: filter === f ? '1px solid rgba(204,255,0,0.25)' : '1px solid transparent',
            cursor:'pointer',
            padding:'3px 10px', borderRadius:'var(--radius-pill)',
            fontSize:11, fontWeight:filter === f ? 600 : 400,
            color: filter === f ? 'var(--accent)' : 'var(--text-3)',
            textTransform:'capitalize',
            transition:'all 120ms',
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
  const asset = ASSETS[symbol] ?? { ...DEFAULT_ASSET, name: symbol }
  const up = asset.change >= 0
  const [period, setPeriod]   = useState<Period>('1D')
  const [tab, setTab]         = useState<AssetTab>('discussion')
  const [watched, setWatched] = useState(false)
  const [sort, setSort]       = useState<SortKey>('hot')
  const [filter, setFilter]   = useState<FilterKey>('all')

  const PERIODS: Period[] = ['1D','1W','1M','3M','1Y','ALL']
  const TABS: { key:AssetTab; label:string }[] = [
    { key:'overview',   label:'Overview'   },
    { key:'discussion', label:'Discussion' },
    { key:'research',   label:'Research'   },
    { key:'agents',     label:'Agents'     },
    { key:'about',      label:'About'      },
  ]

  const short = (addr: string) => `${addr.slice(0,6)}…${addr.slice(-4)}`

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>

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
                <span style={{ fontSize:14, color:'var(--text-2)' }}>{asset.name}</span>
                <span style={{
                  fontSize:10, fontWeight:700, letterSpacing:'0.06em',
                  color:'var(--accent)', background:'var(--accent-dim)',
                  padding:'2px 7px', borderRadius:'var(--radius-badge)',
                }}>
                  STOCK TOKEN
                </span>
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                <span style={{ fontSize:32, fontWeight:700, letterSpacing:'-0.03em', color:'var(--text-1)', fontVariantNumeric:'tabular-nums' }}>
                  ${asset.price.toFixed(2)}
                </span>
                <span style={{
                  fontSize:15, fontWeight:500,
                  color: up ? 'var(--up)' : 'var(--down)',
                  display:'inline-flex', alignItems:'center', gap:4,
                  fontVariantNumeric:'tabular-nums',
                }}>
                  {up ? <ArrowUpRight size={15} strokeWidth={2} /> : <ArrowDownRight size={15} strokeWidth={2} />}
                  {up ? '+' : ''}{asset.change.toFixed(2)} ({up ? '+' : ''}{asset.changePct.toFixed(2)}%)
                </span>
                <span style={{ fontSize:12, color:'var(--text-3)', display:'inline-flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--up)', display:'inline-block', boxShadow:'0 0 4px var(--up)' }} />
                  Live
                </span>
              </div>
            </div>

            {/* Watch button */}
            <button
              onClick={() => setWatched(w => !w)}
              style={{
                display:'inline-flex', alignItems:'center', gap:7,
                padding:'8px 16px', borderRadius:'var(--radius-pill)',
                border: watched ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: watched ? 'var(--accent-dim)' : 'transparent',
                color: watched ? 'var(--accent)' : 'var(--text-2)',
                fontSize:13, fontWeight:600, cursor:'pointer',
                transition:'all 150ms',
              }}
            >
              <Eye size={14} strokeWidth={2} />
              {watched ? 'Watching' : 'Watch'}
            </button>
          </div>

          {/* Chart */}
          <div style={{ margin:'0 -24px', background:'var(--surface)' }}>
            <PriceChart period={period} symbol={symbol} />
          </div>

          {/* Period selector */}
          <div style={{ display:'flex', gap:2, margin:'0 0 0', padding:'8px 0' }}>
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
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:1, background:'var(--border)', margin:'12px -24px 0', padding:'0' }}>
            {[
              { label:'Mkt Cap', value:asset.marketCap },
              { label:'Volume',  value:asset.volume },
              { label:'Open',    value:`$${asset.open.toFixed(2)}` },
              { label:'High',    value:`$${asset.high.toFixed(2)}` },
              { label:'Low',     value:`$${asset.low.toFixed(2)}` },
            ].map(stat => (
              <div key={stat.label} style={{ background:'var(--bg)', padding:'10px 24px' }}>
                <p style={{ fontSize:10, color:'var(--text-3)', fontWeight:500, letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:4 }}>{stat.label}</p>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', fontVariantNumeric:'tabular-nums' }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 24px' }}>
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding:'13px 16px 12px',
              border:'none', borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
              background:'transparent',
              color: tab === key ? 'var(--text-1)' : 'var(--text-3)',
              fontSize:13, fontWeight: tab === key ? 600 : 400,
              cursor:'pointer', marginBottom:-1,
              transition:'color 120ms, border-color 120ms',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Discussion tab */}
        {tab === 'discussion' && (
          <>
            <DiscussionControls sort={sort} setSort={setSort} filter={filter} setFilter={setFilter} />
            <div>
              {POSTS.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          </>
        )}

        {/* Other tabs — stubs */}
        {tab !== 'discussion' && (
          <div style={{ padding:40, color:'var(--text-3)', fontSize:13, textAlign:'center' }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)} — coming soon
          </div>
        )}
      </div>

      {/* ── Right sidebar ── */}
      <aside style={{ width:300, flexShrink:0, padding:'24px 20px', display:'flex', flexDirection:'column', gap:24 }}>

        {/* Token info */}
        <div>
          <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>Token Info</p>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-card)', overflow:'hidden' }}>
            <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border-subtle)' }}>
              <p style={{ fontSize:11, color:'var(--text-3)', marginBottom:4 }}>Contract</p>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-1)' }}>
                  {short(asset.contract)}
                </span>
                <Link
                  href={`https://explorer.robinhood.com/address/${asset.contract}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color:'var(--accent)', display:'inline-flex', alignItems:'center' }}
                >
                  <ExternalLink size={11} strokeWidth={2} />
                </Link>
              </div>
            </div>
            <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border-subtle)' }}>
              <p style={{ fontSize:11, color:'var(--text-3)', marginBottom:4 }}>Network</p>
              <span style={{ fontSize:12, color:'var(--text-1)' }}>Robinhood Chain</span>
            </div>
            <div style={{ padding:'12px 14px' }}>
              <Link
                href={`https://explorer.robinhood.com/address/${asset.contract}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:'inline-flex', alignItems:'center', gap:5,
                  fontSize:12, fontWeight:500, color:'var(--accent)',
                  textDecoration:'none',
                }}
              >
                Verify token on explorer
                <ExternalLink size={11} strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>

        {/* Agents active */}
        <div>
          <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>Agents Active</p>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-card)' }}>
            {[
              { name:'ResearchBot-v2', desc:'Fundamental analysis' },
              { name:'MacroBot-Alpha', desc:'Macro research' },
              { name:'TechAnalyzer',   desc:'Technical signals' },
            ].map((agent, i) => (
              <div key={agent.name} style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <div style={{
                  width:28, height:28, borderRadius:8, flexShrink:0,
                  background:'var(--surface-raised)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Bot size={14} strokeWidth={1.5} style={{ color:'var(--accent)' }} />
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{agent.name}</p>
                  <p style={{ fontSize:11, color:'var(--text-3)' }}>{agent.desc}</p>
                </div>
                <span style={{
                  marginLeft:'auto', fontSize:10, fontWeight:700, letterSpacing:'0.05em',
                  color:'var(--accent)', background:'var(--accent-dim)',
                  padding:'1px 5px', borderRadius:'var(--radius-badge)', flexShrink:0,
                }}>
                  AGENT
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Trade CTA */}
        <div>
          <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>Trade</p>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-card)', padding:'14px' }}>
            <p style={{ fontSize:12, color:'var(--text-2)', marginBottom:12, lineHeight:1.5 }}>
              Roobird connects you to execution partners. We don't execute trades.
            </p>
            <Link href="/market/NVDA/trade" style={{
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
        <div>
          <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>About</p>
          <p style={{ fontSize:12, color:'var(--text-2)', lineHeight:1.6 }}>{asset.description}</p>
        </div>
      </aside>
    </div>
  )
}
