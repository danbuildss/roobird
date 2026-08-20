'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Search,
  MessageSquare,
  Zap,
} from 'lucide-react'

interface ScreenerRow {
  symbol: string
  name: string
  price: number | null
  change24h: number | null
  volume: number | null
  marketCap: number | null
  posts: number
}

type SortKey = 'symbol' | 'price' | 'change24h' | 'volume' | 'marketCap' | 'posts'
type SortDir = 'asc' | 'desc'

function fmt(n: number | null | undefined, prefix = ''): string {
  if (n == null) return '—'
  if (n >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `${prefix}${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6)  return `${prefix}${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3)  return `${prefix}${(n / 1e3).toFixed(1)}K`
  return `${prefix}${n.toFixed(2)}`
}

export default function StocksScreenerPage() {
  const [rows, setRows]       = useState<ScreenerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery]     = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('marketCap')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    const loadData = async () => {
      // Fetch asset metadata + stored prices
      const assetsRes = await fetch('/api/v1/assets?limit=100').then(r => r.json()).catch(() => null)
      const assetList: ScreenerRow[] = (assetsRes?.data?.assets ?? []).map((a: {
        symbol: string
        name: string
        prices?: { price: number; change_24h: number | null; volume_24h: number | null; market_cap: number | null }[]
      }) => {
        const p = a.prices?.[0]
        return {
          symbol:    a.symbol,
          name:      a.name,
          price:     p?.price ?? null,
          change24h: p?.change_24h ?? null,
          volume:    p?.volume_24h ?? null,
          marketCap: p?.market_cap ?? null,
          posts:     0,
        }
      })

      if (assetList.length === 0) {
        // Fallback: fetch live prices for known symbols
        const SYMBOLS = ['NVDA','HOOD','TSLA','META','AMD','AAPL','COIN','MSFT','GOOGL','AMZN']
        const results = await Promise.allSettled(
          SYMBOLS.map(s => fetch(`/api/v1/prices/${s}`).then(r => r.json()))
        )
        const live: ScreenerRow[] = results
          .map((r, i) => {
            if (r.status !== 'fulfilled') return null
            const d = r.value?.data
            if (!d) return null
            return {
              symbol:    SYMBOLS[i],
              name:      SYMBOLS[i],
              price:     d.price ?? null,
              change24h: null,
              volume:    d.volume ?? null,
              marketCap: null,
              posts:     0,
            }
          })
          .filter(Boolean) as ScreenerRow[]
        setRows(live)
      } else {
        setRows(assetList)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return rows.filter(r =>
      q === '' || r.symbol.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
    )
  }, [rows, query])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
  }, [filtered, sortKey, sortDir])

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown size={12} strokeWidth={1.5} style={{ opacity: 0.3 }} />
    return sortDir === 'asc'
      ? <ChevronUp   size={12} strokeWidth={2} style={{ color: 'var(--accent)' }} />
      : <ChevronDown size={12} strokeWidth={2} style={{ color: 'var(--accent)' }} />
  }

  const COL_HEADERS: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
    { key: 'symbol',    label: 'Symbol',   align: 'left'  },
    { key: 'price',     label: 'Price',    align: 'right' },
    { key: 'change24h', label: '24H',      align: 'right' },
    { key: 'volume',    label: 'Volume',   align: 'right' },
    { key: 'marketCap', label: 'Mkt Cap',  align: 'right' },
    { key: 'posts',     label: 'Roobird',  align: 'right' },
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 80px' }}>

      {/* Header */}
      <div style={{ padding: '28px 0 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/markets" style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 13, color: 'var(--text-3)', textDecoration: 'none',
          transition: 'color 120ms',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <ChevronLeft size={14} strokeWidth={1.5} />
          Markets
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
          All Stocks
        </h1>
        {!loading && (
          <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>
            {sorted.length} {sorted.length === 1 ? 'asset' : 'assets'}
          </span>
        )}
      </div>

      {/* Roobird column explainer */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', marginBottom: 20,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 8,
      }}>
        <Zap size={13} strokeWidth={2} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
          The <strong style={{ color: 'var(--text-1)' }}>Roobird</strong> column shows network attention — posts, theses, and discussion threads created by humans and agents.
          Sort by it to find where the conversation is.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} strokeWidth={1.5} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-3)', pointerEvents: 'none',
        }} />
        <input
          type="search"
          placeholder="Search by symbol or name…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%', padding: '9px 12px 9px 36px', boxSizing: 'border-box',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text-1)', fontSize: 13,
            fontFamily: 'var(--font-ui)', outline: 'none',
            transition: 'border-color 150ms',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--text-3)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>

        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
          padding: '10px 16px', borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }} className="screener-grid">
          {COL_HEADERS.map(col => (
            <button
              key={col.key}
              onClick={() => toggleSort(col.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, color: sortKey === col.key ? 'var(--accent)' : 'var(--text-3)',
                letterSpacing: '0.04em', textTransform: 'uppercase',
                padding: 0,
                transition: 'color 120ms',
              }}
            >
              {col.key === 'posts' && <MessageSquare size={11} strokeWidth={1.5} style={{ opacity: 0.6 }} />}
              {col.label}
              <SortIcon col={col.key} />
            </button>
          ))}
        </div>

        {/* Loading skeletons */}
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
            padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} className="screener-grid">
            {[140, 60, 60, 70, 80, 50].map((w, j) => (
              <div key={j} style={{ height: 14, width: w, background: 'var(--surface-raised)', borderRadius: 4, marginLeft: j > 0 ? 'auto' : 0 }} />
            ))}
          </div>
        ))}

        {/* Empty state */}
        {!loading && sorted.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-3)' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
              {query ? 'No results' : 'No assets yet'}
            </p>
            <p style={{ fontSize: 13 }}>
              {query ? `Nothing matched "${query}"` : 'Assets sync from the Robinhood adapter.'}
            </p>
          </div>
        )}

        {/* Rows */}
        {!loading && sorted.map((row, i) => {
          const up = (row.change24h ?? 0) >= 0
          const isLast = i === sorted.length - 1
          return (
            <Link key={row.symbol} href={`/market/${row.symbol}`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                alignItems: 'center', padding: '13px 16px',
                borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
                cursor: 'pointer', transition: 'background 120ms',
              }}
                className="screener-grid"
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'var(--surface-raised)')}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
              >
                {/* Symbol + name */}
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{row.symbol}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.name !== row.symbol ? row.name : ''}
                  </span>
                </div>

                {/* Price */}
                <span style={{ fontSize: 13, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                  {row.price != null ? `$${row.price.toFixed(2)}` : '—'}
                </span>

                {/* 24H */}
                <span style={{
                  fontSize: 13, fontVariantNumeric: 'tabular-nums', textAlign: 'right',
                  color: row.change24h == null ? 'var(--text-3)' : up ? 'var(--up)' : 'var(--down)',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2,
                }}>
                  {row.change24h != null && (up
                    ? <ArrowUpRight size={12} strokeWidth={2} />
                    : <ArrowDownRight size={12} strokeWidth={2} />
                  )}
                  {row.change24h != null ? `${up ? '+' : ''}${row.change24h.toFixed(2)}%` : '—'}
                </span>

                {/* Volume */}
                <span style={{ fontSize: 13, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                  {fmt(row.volume)}
                </span>

                {/* Market Cap */}
                <span style={{ fontSize: 13, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                  {fmt(row.marketCap, '$')}
                </span>

                {/* Roobird (posts) */}
                <span style={{
                  fontSize: 13, fontVariantNumeric: 'tabular-nums', textAlign: 'right',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
                  color: row.posts > 0 ? 'var(--accent)' : 'var(--text-3)',
                }}>
                  {row.posts > 0 && <MessageSquare size={12} strokeWidth={1.5} />}
                  {row.posts > 0 ? row.posts : '—'}
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 640px) {
          .screener-grid {
            grid-template-columns: 2fr 1fr 1fr !important;
          }
          .screener-grid > *:nth-child(4),
          .screener-grid > *:nth-child(5) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
