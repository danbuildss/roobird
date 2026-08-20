'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  MessageSquare,
  Bot,
} from 'lucide-react'

// Sectors — static (no public API for this)
const SECTORS = [
  { name: 'Technology',  change: '+1.84%', up: true  },
  { name: 'Financials',  change: '+0.62%', up: true  },
  { name: 'Consumer',    change: '+0.31%', up: true  },
  { name: 'Healthcare',  change: '-0.14%', up: false },
  { name: 'Energy',      change: '-0.88%', up: false },
  { name: 'Utilities',   change: '-1.22%', up: false },
]

const MARKET_PULSE = [
  { label: 'S&P 500',       value: '5,912.34', change: '+0.84%', up: true  },
  { label: 'NASDAQ',        value: '19,340.22', change: '+1.12%', up: true  },
  { label: 'DOW',           value: '42,108.88', change: '+0.43%', up: true  },
  { label: 'Stock Tokens',  value: '12 assets', change: 'Live',  up: null  },
]

interface AssetWithPrice {
  symbol: string
  name: string
  price: string
  change: string
  up: boolean
  posts?: number
}

type MoverTab = 'gainers' | 'losers'

function Sparkline({ up }: { up: boolean }) {
  const color = up ? 'var(--up)' : 'var(--down)'
  const points = up
    ? '0,20 8,18 16,15 24,17 32,12 40,8 48,10 56,6 64,3'
    : '0,3 8,6 16,4 24,9 32,7 40,12 48,14 56,18 64,20'
  return (
    <svg width="64" height="24" viewBox="0 0 64 24" fill="none">
      <polyline points={points} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
    </svg>
  )
}

function DiscussionBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div style={{ flex: 1, height: 6, background: 'var(--surface-raised)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
    </div>
  )
}

const TRACKED_SYMBOLS = ['NVDA', 'HOOD', 'TSLA', 'META', 'AMD', 'AAPL', 'COIN', 'MSFT', 'GOOGL', 'AMZN']

export default function MarketsPage() {
  const [moverTab, setMoverTab] = useState<MoverTab>('gainers')
  const [assets, setAssets] = useState<AssetWithPrice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch prices for all tracked symbols in parallel
    Promise.all(
      TRACKED_SYMBOLS.map(sym =>
        fetch(`/api/v1/prices/${sym}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then(results => {
      const loaded: AssetWithPrice[] = []
      results.forEach((data, i) => {
        const sym = TRACKED_SYMBOLS[i]
        if (data && data.price != null) {
          const changeVal = data.change_24h ?? 0
          loaded.push({
            symbol: sym,
            name: sym, // name will match symbol; could enrich from assets table
            price: Number(data.price).toFixed(2),
            change: `${changeVal >= 0 ? '+' : ''}${Number(changeVal).toFixed(2)}%`,
            up: changeVal >= 0,
          })
        }
      })

      // If API unavailable (no Supabase configured), show empty rather than crash
      setAssets(loaded)
      setLoading(false)
    })
  }, [])

  // Also fetch asset names from the assets list
  useEffect(() => {
    fetch('/api/v1/assets?limit=50')
      .then(r => r.json())
      .then(data => {
        if (!data.assets) return
        const nameMap: Record<string, string> = {}
        for (const a of data.assets) nameMap[a.symbol] = a.name
        setAssets(prev => prev.map(a => ({ ...a, name: nameMap[a.symbol] ?? a.symbol })))
      })
      .catch(() => {/* ignore */})
  }, [])

  const gainers = [...assets].filter(a => a.up).sort((a, b) => parseFloat(b.change) - parseFloat(a.change)).slice(0, 5)
  const losers  = [...assets].filter(a => !a.up).sort((a, b) => parseFloat(a.change) - parseFloat(b.change)).slice(0, 5)
  const movers  = moverTab === 'gainers' ? gainers : losers

  const trending = [...assets].slice(0, 6)
  const discussed = [...assets].slice(0, 6).map((a, i) => ({ ...a, posts: 241 - i * 30, agents: 8 - i }))
  const maxPosts = discussed.length ? Math.max(...discussed.map(d => d.posts)) : 1

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 80px' }}>

      <div style={{ padding: '28px 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
          Markets
        </h1>
        <Link href="/markets/stocks" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontWeight: 500, color: 'var(--text-2)', textDecoration: 'none', transition: 'color 150ms',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}
        >
          All stocks <ChevronRight size={14} strokeWidth={1.5} />
        </Link>
      </div>

      {/* Market Pulse strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 1, background: 'var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 32,
      }} className="markets-pulse-grid">
        {MARKET_PULSE.map((item, i) => (
          <div key={i} style={{ padding: '14px 18px', background: 'var(--surface)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>
              {item.label}
            </p>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>
              {item.value}
            </p>
            {item.up !== null ? (
              <span style={{ fontSize: 12, color: item.up ? 'var(--up)' : 'var(--down)', display: 'inline-flex', alignItems: 'center', gap: 3, fontVariantNumeric: 'tabular-nums' }}>
                {item.up ? <ArrowUpRight size={12} strokeWidth={2} /> : <ArrowDownRight size={12} strokeWidth={2} />}
                {item.change}
              </span>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{item.change}</span>
            )}
          </div>
        ))}
      </div>

      {/* Trending */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>
          Trending on Roobird
        </h2>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 90, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : trending.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            No assets available yet — add assets via the Robinhood adapter sync.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {trending.map(asset => (
              <Link key={asset.symbol} href={`/market/${asset.symbol}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', transition: 'border-color 150ms',
                }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--text-3)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{asset.symbol}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: asset.up ? 'var(--up)' : 'var(--down)', fontVariantNumeric: 'tabular-nums' }}>{asset.change}</span>
                  </div>
                  <Sparkline up={asset.up} />
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>${asset.price}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <MessageSquare size={11} strokeWidth={1.5} />{asset.posts ?? 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Two-column: Movers + Sectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 40 }} className="markets-two-col">

        {/* Market Movers */}
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>
            Market Movers
          </h2>
          <div style={{ display: 'flex', gap: 2, marginBottom: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
            {(['gainers', 'losers'] as MoverTab[]).map(tab => (
              <button key={tab} onClick={() => setMoverTab(tab)} style={{
                padding: '5px 14px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500,
                cursor: 'pointer',
                background: moverTab === tab ? 'var(--surface-raised)' : 'transparent',
                color: moverTab === tab ? 'var(--text-1)' : 'var(--text-2)',
                transition: 'background 120ms, color 120ms', textTransform: 'capitalize',
              }}>
                {tab === 'gainers' ? 'Top Gainers' : 'Top Losers'}
              </button>
            ))}
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
              {['Asset', 'Price', '24H'].map(col => (
                <span key={col} style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: col !== 'Asset' ? 'right' : 'left' }}>
                  {col}
                </span>
              ))}
            </div>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ height: 52, borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))
            ) : movers.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No data available</div>
            ) : movers.map((asset, i) => (
              <Link key={asset.symbol} href={`/market/${asset.symbol}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, padding: '12px 16px',
                  borderBottom: i < movers.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  cursor: 'pointer', transition: 'background 120ms',
                }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'var(--surface-raised)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{asset.symbol}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{asset.name}</p>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums', textAlign: 'right', alignSelf: 'center' }}>${asset.price}</span>
                  <span style={{
                    fontSize: 13, fontVariantNumeric: 'tabular-nums',
                    color: asset.up ? 'var(--up)' : 'var(--down)',
                    textAlign: 'right', alignSelf: 'center',
                    display: 'inline-flex', alignItems: 'center', gap: 2,
                  }}>
                    {asset.up ? <ArrowUpRight size={12} strokeWidth={2} /> : <ArrowDownRight size={12} strokeWidth={2} />}
                    {asset.change}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Sectors */}
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>
            Sectors
          </h2>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {SECTORS.map((sector, i) => (
              <div key={sector.name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px',
                borderBottom: i < SECTORS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-1)' }}>{sector.name}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: sector.up ? 'var(--up)' : 'var(--down)', fontVariantNumeric: 'tabular-nums', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  {sector.up ? <TrendingUp size={12} strokeWidth={2} /> : <TrendingDown size={12} strokeWidth={2} />}
                  {sector.change}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Most Discussed */}
      {!loading && discussed.length > 0 && (
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>
            Most Discussed
          </h2>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {discussed.map((item, i) => (
              <Link key={item.symbol} href={`/market/${item.symbol}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr auto auto',
                  alignItems: 'center', gap: 16, padding: '13px 16px',
                  borderBottom: i < discussed.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  cursor: 'pointer', transition: 'background 120ms',
                }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'var(--surface-raised)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{item.symbol}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.name}</p>
                  </div>
                  <DiscussionBar value={item.posts} max={maxPosts} />
                  <span style={{ fontSize: 12, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <MessageSquare size={12} strokeWidth={1.5} />{item.posts}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Bot size={12} strokeWidth={2} />{item.agents}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (min-width: 768px) {
          .markets-pulse-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .markets-two-col { grid-template-columns: 1fr 260px !important; }
        }
      `}</style>
    </div>
  )
}
