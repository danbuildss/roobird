import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'
import { fetchPrice } from '@/lib/adapters/robinhood/client'

export const revalidate = 15

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const upper = symbol.toUpperCase()

  // Fetch Robinhood live price and Supabase change_24h in parallel
  // Robinhood client has a safe default base URL; change_24h enriches from cron snapshots
  const [liveResult, supabase] = await Promise.all([
    fetchPrice(upper).catch(() => null),
    createClient(),
  ])

  if (liveResult) {
    // Also grab change_24h from Supabase (Robinhood doesn't provide it)
    const { data: asset } = await supabase
      .from('assets')
      .select('prices ( change_24h, recorded_at )')
      .eq('symbol', upper)
      .eq('is_active', true)
      .order('recorded_at', { ascending: false, referencedTable: 'prices' })
      .limit(1, { referencedTable: 'prices' })
      .single()

    const change24h = (asset?.prices as Array<{ change_24h: number | null }> | undefined)?.[0]?.change_24h ?? null

    return ok({
      symbol: liveResult.symbol,
      price: liveResult.price,
      bid: liveResult.bid,
      ask: liveResult.ask,
      change_24h: change24h,
      volume: liveResult.volume,
      market_cap: null,
      isHalted: liveResult.isHalted,
      updatedAt: liveResult.updatedAt,
    })
  }

  // Full Supabase fallback — seeded or last cron snapshot
  const { data: asset } = await supabase
    .from('assets')
    .select(`
      id, symbol,
      prices ( price, bid, ask, change_24h, volume_24h, market_cap, is_halted, recorded_at )
    `)
    .eq('symbol', upper)
    .eq('is_active', true)
    .order('recorded_at', { ascending: false, referencedTable: 'prices' })
    .limit(1, { referencedTable: 'prices' })
    .single()

  if (!asset) return Errors.notFound(`Asset ${symbol} not found`)

  const p = (asset.prices as Array<{
    price: number; bid: number | null; ask: number | null
    change_24h: number | null; volume_24h: number | null
    market_cap: number | null; is_halted: boolean; recorded_at: string
  }>)?.[0]

  if (!p) return Errors.notFound(`No price data for ${symbol}`)

  return ok({
    symbol: (asset as { symbol: string }).symbol,
    price: Number(p.price),
    bid: p.bid != null ? Number(p.bid) : null,
    ask: p.ask != null ? Number(p.ask) : null,
    change_24h: p.change_24h != null ? Number(p.change_24h) : null,
    volume: p.volume_24h != null ? Number(p.volume_24h) : null,
    market_cap: p.market_cap != null ? Number(p.market_cap) : null,
    isHalted: p.is_halted,
    updatedAt: p.recorded_at,
  })
}
