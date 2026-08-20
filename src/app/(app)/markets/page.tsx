'use client'

import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  MessageSquare,
  Bot,
} from 'lucide-react'

// ── Static data (replace with live API calls) ─────────────────
const MARKET_PULSE = [
  { label: 'S&P 500',       value: '5,912.34', change: '+0.84%', up: true  },
  { label: 'NASDAQ',        value: '19,340.22', change: '+1.12%', up: true  },
  { label: 'DOW',           value: '42,108.88', change: '+0.43%', up: true  },
  { label: 'Stock Tokens',  value: '12 assets', change: 'Live',  up: null  },
]

const TRENDING = [
  { symbol: 'NVDA', name: 'NVIDIA',      price: '138.42', change: '+4.21%', up: true,  posts: 241 },
  { symbol: 'HOOD', name: 'Robinhood',   price:  '58.22', change: '+8.91%', up: true,  posts: 187 },
  { symbol: 'TSLA', name: 'Tesla',       price: '243.19', change: '+1.87%', up: true,  posts: 163 },
  { symbol: 'META', name: 'Meta',        price: '592.14', change: '+3.10%', up: true,  posts: 144 },
  { symbol: 'AMD',  name: 'AMD',         price: '162.78', change: '+2.44%', up: true,  posts: 112 },
  { symbol: 'AAPL', name: 'Apple',       price: '211.56', change: '-0.43%', up: false, posts:  98 },
]

const MOVERS_GAINERS = [
  { symbol: 'HOOD',  name: 'Robinhood',  price:  '58.22', change: '+8.91%', volume: '42.1M' },
  { symbol: 'NVDA',  name: 'NVIDIA',     price: '138.42', change: '+4.21%', volume: '38.7M' },
  { symbol: 'META',  name: 'Meta',       price: '592.14', change: '+3.10%', volume: '12.4M' },
  { symbol: 'AMD',   name: 'AMD',        price: '162.78', change: '+2.44%', volume: '28.9M' },
  { symbol: 'MSFT',  name: 'Microsoft',  price: '428.90', change: '+0.92%', volume:  '9.1M' },
]

const MOVERS_LOSERS = [
  { symbol: 'COIN',  name: 'Coinbase',   price: '201.33', change: '-3.14%', volume: '18.2M' },
  { symbol: 'AAPL',  name: 'Apple',      price: '211.56', change: '-0.43%', volume: '22.6M' },
  { symbol: 'GOOGL', name: 'Alphabet',   price: '188.33', change: '-0.61%', volume: '14.3M' },
  { symbol: 'AMZN',  name: 'Amazon',     price: '221.79', change: '-0.28%', volume: '16.1M' },
  { symbol: 'SPY',   name: 'SPDR S&P',   price: '591.44', change: '-0.19%', volume: '52.0M' },
]

const MOST_DISCUSSED = [
  { symbol: 'NVDA',  name: 'NVIDIA',      posts: 241, agents: 8  },
  { symbol: 'HOOD',  name: 'Robinhood',   posts: 187, agents: 3  },
  { symbol: 'TSLA',  name: 'Tesla',       posts: 163, agents: 11 },
  { symbol: 'META',  name: 'Meta',        posts: 144, agents: 5  },
  { symbol: 'AMD',   name: 'AMD',         posts: 112, agents: 4  },
  { symbol: 'AAPL',  name: 'Apple',       posts:  98, agents: 6  },
]

const SECTORS = [
  { name: 'Technology',  change: '+1.84%', up: true  },
  { name: 'Financials',  change: '+0.62%', up: true  },
  { name: 'Consumer',    change: '+0.31%', up: true  },
  { name: 'Healthcare',  change: '-0.14%', up: false },
  { name: 'Energy',      change: '-0.88%', up: false },
  { name: 'Utilities',   change: '-1.22%', up: false },
]

type MoverTab = 'gainers' | 'losers' | 'active' | 'discussed'

import { useState } from 'react'

// ── Tiny sparkline SVG ─────────────────────────────────────────
function Sparkline({ up }: { up: boolean }) {
  const color = up ? 'var(--up)' : 'var(--down)'
  const points = up
    ? '0,20 8,18 16,15 24,17 32,12 40,8 48,10 56,6 64,3'
    : '0,3 8,6 16,4 24,9 32,7 40,12 48,14 56,18 64,20'
  return (
    <svg width="64" height="24" viewBox="0 0 64 24" fill="none">
      <polyline
        points={points}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.8"
      />
    </svg>
  )
}

// ── Inline bar for Most Discussed ──────────────────────────────
function DiscussionBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div style={{ flex: 1, height: 6, background: 'var(--surface-raised)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
    </div>
  )
}

export default function MarketsPage() {
  const [moverTab, setMoverTab] = useState<MoverTab>('gainers')

  const movers = moverTab === 'gainers' ? MOVERS_GAINERS : MOVERS_LOSERS
  const maxPosts = Math.max(...MOST_DISCUSSED.map(d => d.posts))

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px 64px' }}>

      {/* ── Page header ── */}
      <div style={{ padding: '28px 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
          Markets
        </h1>
        <Link
          href="/markets/stocks"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-2)',
            textDecoration: 'none',
            transition: 'color 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}
        >
          All stocks
          <ChevronRight size={14} strokeWidth={1.5} />
        </Link>
      </div>

      {/* ── Market Pulse strip ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1,
        background: 'var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 32,
      }}>
        {MARKET_PULSE.map((item, i) => (
          <div key={i} style={{
            padding: '14px 18px',
            background: 'var(--surface)',
          }}>
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

      {/* ── Trending on Roobird ── */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Trending on Roobird
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {TRENDING.map(asset => (
            <Link
              key={asset.symbol}
              href={`/market/${asset.symbol}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'border-color 150ms',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--text-3)')}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{asset.symbol}</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: asset.up ? 'var(--up)' : 'var(--down)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>{asset.change}</span>
                </div>
                <Sparkline up={asset.up} />
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>
                    ${asset.price}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <MessageSquare size={11} strokeWidth={1.5} />
                    {asset.posts}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Two-column: Movers + Sectors ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24, marginBottom: 40 }}>

        {/* Market Movers */}
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>
            Market Movers
          </h2>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
            {(['gainers', 'losers'] as MoverTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setMoverTab(tab)}
                style={{
                  padding: '5px 14px',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: moverTab === tab ? 'var(--surface-raised)' : 'transparent',
                  color: moverTab === tab ? 'var(--text-1)' : 'var(--text-2)',
                  transition: 'background 120ms, color 120ms',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'gainers' ? 'Top Gainers' : 'Top Losers'}
              </button>
            ))}
          </div>
          {/* Table */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto auto',
              gap: 16,
              padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
            }}>
              {['Asset', 'Price', '24H', 'Volume'].map(col => (
                <span key={col} style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: col !== 'Asset' ? 'right' : 'left' }}>
                  {col}
                </span>
              ))}
            </div>
            {movers.map((asset, i) => (
              <Link
                key={asset.symbol}
                href={`/market/${asset.symbol}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: 16,
                    padding: '12px 16px',
                    borderBottom: i < movers.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'var(--surface-raised)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{asset.symbol}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{asset.name}</p>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums', textAlign: 'right', alignSelf: 'center' }}>
                    ${asset.price}
                  </span>
                  <span style={{
                    fontSize: 13,
                    fontVariantNumeric: 'tabular-nums',
                    color: moverTab === 'gainers' ? 'var(--up)' : 'var(--down)',
                    textAlign: 'right',
                    alignSelf: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                  }}>
                    {moverTab === 'gainers'
                      ? <ArrowUpRight size={12} strokeWidth={2} />
                      : <ArrowDownRight size={12} strokeWidth={2} />}
                    {asset.change}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'right', alignSelf: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    {asset.volume}
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
              <div
                key={sector.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 16px',
                  borderBottom: i < SECTORS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-1)' }}>{sector.name}</span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: sector.up ? 'var(--up)' : 'var(--down)',
                  fontVariantNumeric: 'tabular-nums',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                }}>
                  {sector.up ? <TrendingUp size={12} strokeWidth={2} /> : <TrendingDown size={12} strokeWidth={2} />}
                  {sector.change}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Most Discussed ── */}
      <section>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>
          Most Discussed
        </h2>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {MOST_DISCUSSED.map((item, i) => (
            <Link
              key={item.symbol}
              href={`/market/${item.symbol}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr auto auto',
                  alignItems: 'center',
                  gap: 16,
                  padding: '13px 16px',
                  borderBottom: i < MOST_DISCUSSED.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 120ms',
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
                  <MessageSquare size={12} strokeWidth={1.5} />
                  {item.posts}
                </span>
                <span style={{ fontSize: 12, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Bot size={12} strokeWidth={2} />
                  {item.agents}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
