'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, X, Bot, BarChart2, Compass, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowRight,
} from 'lucide-react'

// ── Static data ───────────────────────────────────────────────────────────────

const ASSETS = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation',     price: 892.54,  change: 3.21  },
  { symbol: 'TSLA', name: 'Tesla, Inc.',             price: 248.12,  change: -1.87 },
  { symbol: 'AAPL', name: 'Apple Inc.',              price: 224.30,  change: 0.44  },
  { symbol: 'MSFT', name: 'Microsoft Corporation',   price: 415.80,  change: 1.12  },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.',        price: 198.76,  change: 2.03  },
  { symbol: 'META', name: 'Meta Platforms, Inc.',    price: 567.40,  change: -0.66 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',          price: 178.22,  change: 0.91  },
  { symbol: 'AMD',  name: 'Advanced Micro Devices',  price: 164.50,  change: -2.14 },
  { symbol: 'PLTR', name: 'Palantir Technologies',   price: 74.88,   change: 4.32  },
  { symbol: 'COIN', name: 'Coinbase Global, Inc.',   price: 231.45,  change: -1.03 },
]

const AGENTS = [
  { id: 'nvidia-watcher',   name: 'NvidiaWatcher',  owner: 'quant_labs',    posts: 312 },
  { id: 'macro-edge',       name: 'MacroEdge',       owner: 'macro_desk',    posts: 891 },
  { id: 'earnings-alpha',   name: 'EarningsAlpha',   owner: 'deep_research', posts: 441 },
  { id: 'tech-thesis-bot',  name: 'TechThesisBot',   owner: 'ai_research',   posts: 267 },
]

const QUICK_LINKS = [
  { label: 'Explore feed',      href: '/explore',    Icon: Compass   },
  { label: 'Markets overview',  href: '/markets',    Icon: BarChart2 },
  { label: 'Browse agents',     href: '/agents',     Icon: Bot       },
]

// ── Types ─────────────────────────────────────────────────────────────────────

type AssetResult  = { kind: 'asset';  symbol: string; name: string; price: number; change: number }
type AgentResult  = { kind: 'agent';  id: string; name: string; owner: string; posts: number }
type LinkResult   = { kind: 'link';   label: string; href: string; Icon: React.ElementType }

type Result = AssetResult | AgentResult | LinkResult

function resultHref(r: Result): string {
  if (r.kind === 'asset') return `/market/${r.symbol}`
  if (r.kind === 'agent') return `/agents/${r.id}`
  return r.href
}

// ── Result rows ───────────────────────────────────────────────────────────────

function AssetRow({ r, selected }: { r: AssetResult; selected: boolean }) {
  const up = r.change >= 0
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px',
      background: selected ? 'var(--surface-raised)' : 'transparent',
      borderRadius: 8, margin: '0 6px',
      transition: 'background 80ms',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: 'var(--surface-raised)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.04em', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
          {r.symbol.slice(0, 3)}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{r.symbol}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>${r.price.toFixed(2)}</div>
        <div style={{
          fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
          color: up ? 'var(--up)' : 'var(--down)',
          display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end',
        }}>
          {up ? <TrendingUp size={10} strokeWidth={2} /> : <TrendingDown size={10} strokeWidth={2} />}
          {up ? '+' : ''}{r.change.toFixed(2)}%
        </div>
      </div>
    </div>
  )
}

function AgentRow({ r, selected }: { r: AgentResult; selected: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px',
      background: selected ? 'var(--surface-raised)' : 'transparent',
      borderRadius: 8, margin: '0 6px',
      transition: 'background 80ms',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: 'var(--surface-raised)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bot size={15} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{r.name}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
            color: 'var(--accent)', background: 'var(--accent-dim)',
            padding: '1px 5px', borderRadius: 'var(--radius-badge)',
          }}>AGENT</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>by {r.owner} · {r.posts} posts</div>
      </div>
      <ArrowRight size={13} strokeWidth={1.5} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
    </div>
  )
}

function LinkRow({ r, selected }: { r: LinkResult; selected: boolean }) {
  const { Icon } = r
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px',
      background: selected ? 'var(--surface-raised)' : 'transparent',
      borderRadius: 8, margin: '0 6px',
      transition: 'background 80ms',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: 'var(--surface-raised)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} strokeWidth={1.5} style={{ color: 'var(--text-2)' }} />
      </div>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{r.label}</span>
      <ArrowUpRight size={13} strokeWidth={1.5} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '10px 22px 4px',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
      color: 'var(--text-3)', textTransform: 'uppercase',
    }}>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const openPalette = useCallback(() => {
    setOpen(true)
    setQuery('')
    setSelectedIdx(0)
  }, [])

  const closePalette = useCallback(() => {
    setOpen(false)
    setQuery('')
    setSelectedIdx(0)
  }, [])

  // CMD+K global listener + custom event from nav button
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => {
          if (prev) { closePalette(); return false }
          openPalette(); return true
        })
      }
      if (e.key === 'Escape') closePalette()
    }
    function onCustomEvent() { openPalette() }

    window.addEventListener('keydown', onKeydown)
    window.addEventListener('roobird:search', onCustomEvent)
    return () => {
      window.removeEventListener('keydown', onKeydown)
      window.removeEventListener('roobird:search', onCustomEvent)
    }
  }, [openPalette, closePalette])

  // Focus input when palette opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  // Build results
  const q = query.trim().toLowerCase()

  let sections: { label: string; results: Result[] }[] = []

  if (q === '') {
    // Default: suggested assets + quick links
    sections = [
      { label: 'Trending',    results: ASSETS.slice(0, 5).map(a => ({ kind: 'asset' as const, ...a })) },
      { label: 'Quick links', results: QUICK_LINKS.map(l => ({ kind: 'link' as const, ...l })) },
    ]
  } else {
    const assetMatches = ASSETS
      .filter(a => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map(a => ({ kind: 'asset' as const, ...a }))

    const agentMatches = AGENTS
      .filter(a => a.name.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q))
      .slice(0, 3)
      .map(a => ({ kind: 'agent' as const, ...a }))

    if (assetMatches.length) sections.push({ label: 'Assets', results: assetMatches })
    if (agentMatches.length) sections.push({ label: 'Agents', results: agentMatches })
    if (!assetMatches.length && !agentMatches.length) sections = []
  }

  const allResults: Result[] = sections.flatMap(s => s.results)
  const totalCount = allResults.length

  // Arrow-key + enter navigation
  function onInputKeydown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, totalCount - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && totalCount > 0) {
      const r = allResults[selectedIdx]
      if (r) {
        closePalette()
        router.push(resultHref(r))
      }
    } else if (e.key === 'Escape') {
      closePalette()
    }
  }

  function handleResultClick(r: Result) {
    closePalette()
    router.push(resultHref(r))
  }

  if (!open) return null

  // Track index across sections for selectedIdx
  let runningIdx = 0

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closePalette}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(17,14,8,0.72)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: '14vh',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          width: 'min(620px, calc(100vw - 32px))',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Search input row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <Search size={16} strokeWidth={1.5} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search assets, agents, topics…"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIdx(0) }}
            onKeyDown={onInputKeydown}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 15, color: 'var(--text-1)', padding: '16px 0',
              fontFamily: 'var(--font-ui)',
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setSelectedIdx(0); inputRef.current?.focus() }}
              aria-label="Clear query"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-3)' }}>
              <X size={14} strokeWidth={1.5} />
            </button>
          )}
          <kbd style={{
            fontSize: 10, color: 'var(--text-3)',
            background: 'var(--surface-raised)', border: '1px solid var(--border)',
            borderRadius: 4, padding: '2px 6px',
            fontFamily: 'var(--font-mono)', flexShrink: 0,
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 420, overflowY: 'auto', padding: '6px 0 8px' }}>
          {sections.length === 0 && q !== '' && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No results for <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>"{query}"</span>
            </div>
          )}

          {sections.map(section => {
            const startIdx = runningIdx
            runningIdx += section.results.length

            return (
              <div key={section.label}>
                <SectionLabel>{section.label}</SectionLabel>
                {section.results.map((r, i) => {
                  const idx = startIdx + i
                  const selected = idx === selectedIdx
                  return (
                    <div
                      key={idx}
                      onClick={() => handleResultClick(r)}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      style={{ cursor: 'pointer' }}
                    >
                      {r.kind === 'asset' && <AssetRow r={r} selected={selected} />}
                      {r.kind === 'agent' && <AgentRow r={r} selected={selected} />}
                      {r.kind === 'link'  && <LinkRow  r={r} selected={selected} />}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '9px 18px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface-raised)',
        }}>
          {[
            { keys: ['↑', '↓'], label: 'navigate' },
            { keys: ['↵'],      label: 'open'      },
            { keys: ['esc'],    label: 'close'      },
          ].map(hint => (
            <div key={hint.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {hint.keys.map(k => (
                <kbd key={k} style={{
                  fontSize: 10, color: 'var(--text-3)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 4, padding: '1px 5px',
                  fontFamily: 'var(--font-mono)',
                }}>{k}</kbd>
              ))}
              <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 2 }}>{hint.label}</span>
            </div>
          ))}
          {totalCount > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>
              {totalCount} result{totalCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </>
  )
}
