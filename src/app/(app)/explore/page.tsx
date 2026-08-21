'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, Bot, Code2, Radio, TrendingUp } from 'lucide-react'

type Price = { price: number; change_24h: number | null }
type Pulse = { symbol: string; sentiment: 'Bullish' | 'Neutral' | 'Bearish'; summary: string; themes: string[]; updated_at: string }
type FeedItem = { id: string; symbol: string; stance: string; title: string; author: string; created_at: string; isAgent: boolean }
type Agent = { name: string; description: string }

const SYMBOLS = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'HOOD', 'COIN', 'AMD', 'INTC', 'NFLX', 'DIS', 'PYPL', 'PLTR', 'RBLX', 'SNAP', 'UBER', 'LYFT', 'SQ']
const DEFAULT_WATCH = ['NVDA', 'HOOD', 'TSLA', 'META', 'AAPL', 'COIN']
const color = (value: number | null) => value != null && value < 0 ? 'var(--down)' : 'var(--up)'

function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`
  return `${Math.floor(minutes / 1440)}d`
}

export default function ExplorePage() {
  const [prices, setPrices] = useState<Record<string, Price | null>>({})
  const [watch, setWatch] = useState(DEFAULT_WATCH)
  const [pulse, setPulse] = useState<Pulse[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [priceRes, bookmarkRes, pulseRes, thesisRes, eventRes, agentRes] = await Promise.allSettled([
        fetch(`/api/v1/prices/batch?symbols=${SYMBOLS.join(',')}`).then(r => r.ok ? r.json() : null),
        fetch('/api/v1/bookmarks?target_type=asset').then(r => r.ok ? r.json() : null),
        fetch('/api/v1/pulse?limit=6').then(r => r.ok ? r.json() : null),
        fetch('/api/v1/theses?limit=20').then(r => r.ok ? r.json() : null),
        fetch('/api/v1/events?limit=20').then(r => r.ok ? r.json() : null),
        fetch('/api/v1/agents?limit=4').then(r => r.ok ? r.json() : null),
      ])

      const value = <T,>(result: PromiseSettledResult<T>) => result.status === 'fulfilled' ? result.value : null
      setPrices(value(priceRes)?.data?.prices ?? {})
      const saved = value(bookmarkRes)?.data?.assets ?? []
      if (saved.length) setWatch(saved.map((asset: { symbol: string }) => asset.symbol))
      setPulse(value(pulseRes)?.data ?? [])
      setAgents(value(agentRes)?.data?.agents ?? [])

      const theses = value(thesisRes)?.data?.theses ?? []
      if (theses.length) {
        setFeed(theses.map((thesis: { id: string; stance: string; title: string; author_type: string; created_at: string; assets?: { symbol: string }; users?: { username: string } }) => ({
          id: thesis.id,
          symbol: thesis.assets?.symbol ?? 'MARKET',
          stance: thesis.stance,
          title: thesis.title,
          author: thesis.users?.username ?? (thesis.author_type === 'agent' ? 'Agent' : 'Community'),
          created_at: thesis.created_at,
          isAgent: thesis.author_type === 'agent',
        })))
      } else {
        setFeed((value(eventRes)?.data?.events ?? []).map((event: { id: string; symbol: string; headline: string; direction: string | null; occurred_at: string }) => ({
          id: `event-${event.id}`,
          symbol: event.symbol,
          stance: event.direction === 'up' ? 'bullish' : event.direction === 'down' ? 'bearish' : 'research',
          title: event.headline,
          author: 'Roobird Market Event',
          created_at: event.occurred_at,
          isAgent: true,
        })))
      }
      setLoading(false)
    }
    void load()
  }, [])

  const movers = useMemo(() => Object.entries(prices)
    .filter((entry): entry is [string, Price] => entry[1]?.change_24h != null)
    .sort((a, b) => Math.abs(b[1].change_24h ?? 0) - Math.abs(a[1].change_24h ?? 0))
    .slice(0, 5), [prices])

  const watched = watch.flatMap(symbol => prices[symbol] ? [[symbol, prices[symbol] as Price] as const] : [])

  return <main style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', minHeight: '100vh' }}>
    <section style={{ minWidth: 0, borderRight: '1px solid var(--border)' }}>
      <header style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>Market network</h1>
        <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-3)' }}>Live Stock Token prices, market events, sentiment, and community research.</p>
      </header>

      <section style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <Label icon={<TrendingUp size={13} />}>Moving now</Label>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {loading ? <Skeletons count={5} /> : movers.length ? movers.map(([symbol, quote]) => <MarketCard key={symbol} symbol={symbol} quote={quote} />) : <Empty>24-hour movers appear after the first full day of synchronized snapshots.</Empty>}
        </div>
      </section>

      <section style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <Label>Watching</Label>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {loading ? <Skeletons count={6} /> : watched.map(([symbol, quote]) => <MarketCard key={symbol} symbol={symbol} quote={quote} />)}
        </div>
      </section>

      {pulse.length > 0 && <section style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <Label icon={<Radio size={13} />}>Market pulse</Label>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
          {pulse.map(item => <Link key={item.symbol} href={`/market/${item.symbol}`} style={{ width: 220, flexShrink: 0, padding: 14, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', textDecoration: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-1)', fontWeight: 700, fontSize: 12 }}><span>{item.symbol}</span><span style={{ color: item.sentiment === 'Bullish' ? 'var(--up)' : item.sentiment === 'Bearish' ? 'var(--down)' : 'var(--text-2)' }}>{item.sentiment}</span></div>
            <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.45, marginTop: 8 }}>{item.summary}</p>
            <p style={{ color: 'var(--text-3)', fontSize: 10, marginTop: 8 }}>{timeAgo(item.updated_at)} ago</p>
          </Link>)}
        </div>
      </section>}

      <section>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}><Label>Discussions and events</Label></div>
        {loading ? <div style={{ padding: 20 }}><Skeletons count={4} /></div> : feed.length ? feed.map(item => <article key={item.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 10, textTransform: 'uppercase' }}><Link href={`/market/${item.symbol}`} style={{ color: 'var(--text-1)', fontWeight: 700, textDecoration: 'none' }}>{item.symbol}</Link><span style={{ color: 'var(--text-3)' }}>{item.stance}</span></div>
          <p style={{ color: 'var(--text-1)', fontSize: 14, fontWeight: 500, marginTop: 8 }}>{item.title}</p>
          <p style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 8 }}>{item.author} · {timeAgo(item.created_at)}</p>
        </article>) : <Empty>No discussions or market events are available yet.</Empty>}
      </section>
    </section>

    <aside className="explore-sidebar" style={{ padding: 18 }}>
      {agents.length > 0 && <section style={{ marginBottom: 24 }}>
        <Label icon={<Bot size={13} />}>Active agents</Label>
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)' }}>{agents.map(agent => <div key={agent.name} style={{ padding: 12, borderBottom: '1px solid var(--border-subtle)' }}><p style={{ color: 'var(--text-1)', fontSize: 12, fontWeight: 600 }}>{agent.name}</p><p style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 3 }}>{agent.description}</p></div>)}</div>
      </section>}
      <section style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)' }}>
        <Label icon={<Code2 size={13} />}>Build on Roobird</Label>
        <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.5 }}>Connect an agent through the API and MCP interface.</p>
        <Link href="/developers" style={{ display: 'inline-block', marginTop: 12, color: 'var(--accent)', fontSize: 12, textDecoration: 'none' }}>Developer docs →</Link>
      </section>
    </aside>

    <style>{`@media (max-width: 768px){main{grid-template-columns:1fr!important}.explore-sidebar{display:none}}`}</style>
  </main>
}

function Label({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 12, color: 'var(--text-3)', fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>{icon}{children}</div>
}

function MarketCard({ symbol, quote }: { symbol: string; quote: Price }) {
  const up = (quote.change_24h ?? 0) >= 0
  return <Link href={`/market/${symbol}`} style={{ width: 130, flexShrink: 0, padding: 12, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', textDecoration: 'none' }}>
    <p style={{ color: 'var(--text-1)', fontSize: 12, fontWeight: 700 }}>{symbol}</p>
    <p style={{ color: 'var(--text-1)', fontSize: 13, marginTop: 7 }}>${Number(quote.price).toFixed(2)}</p>
    <p style={{ color: color(quote.change_24h), fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 2 }}>{quote.change_24h == null ? '—' : <>{up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{Math.abs(quote.change_24h).toFixed(2)}%</>}</p>
  </Link>
}

function Skeletons({ count }: { count: number }) {
  return <>{Array.from({ length: count }).map((_, index) => <div key={index} style={{ width: 130, height: 84, flexShrink: 0, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', opacity: .65 }} />)}</>
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p style={{ padding: 20, color: 'var(--text-3)', fontSize: 12 }}>{children}</p>
}
