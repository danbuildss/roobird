import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'
import { fetchPrice } from '@/lib/adapters/robinhood/client'

export const revalidate = 15

type PriceRow = {
  price: number; bid: number | null; ask: number | null
  change_24h: number | null; volume_24h: number | null
  market_cap: number | null; is_halted: boolean; recorded_at: string
}
type AssetRow = { id: string; symbol: string; prices: PriceRow[] }

function supabasePriceToShape(sym: string, p: PriceRow): object {
  return {
    symbol: sym,
    price: Number(p.price),
    bid: p.bid != null ? Number(p.bid) : null,
    ask: p.ask != null ? Number(p.ask) : null,
    change_24h: p.change_24h != null ? Number(p.change_24h) : null,
    volume: p.volume_24h != null ? Number(p.volume_24h) : null,
    market_cap: p.market_cap != null ? Number(p.market_cap) : null,
    isHalted: p.is_halted,
    updatedAt: p.recorded_at,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('symbols') ?? ''

  if (!raw) return Errors.badRequest('symbols param required')

  const symbols = raw
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 500)

  if (symbols.length === 0) return Errors.badRequest('no valid symbols')

  const prices: Record<string, object | null> = {}
  const needsSupabase: string[] = []

  // Fetch Robinhood live prices + Supabase change_24h in parallel
  // Robinhood client has a safe default base URL; Supabase enriches with change_24h
  const [robinhoodResults, supabaseAll] = await Promise.all([
    Promise.allSettled(symbols.map(sym => fetchPrice(sym))),
    createClient().then(sb =>
      sb.from('assets')
        .select('symbol, prices ( change_24h, recorded_at )')
        .in('symbol', symbols)
        .eq('is_active', true)
        .order('recorded_at', { ascending: false, referencedTable: 'prices' })
        .limit(1, { referencedTable: 'prices' })
    ),
  ])

  // Build a change_24h map from Supabase
  const change24hMap: Record<string, number | null> = {}
  if (!supabaseAll.error && supabaseAll.data) {
    for (const asset of supabaseAll.data as Array<{ symbol: string; prices: Array<{ change_24h: number | null }> }>) {
      change24hMap[asset.symbol] = asset.prices?.[0]?.change_24h ?? null
    }
  }

  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i]
    const result = robinhoodResults[i]
    if (result.status === 'fulfilled') {
      const live = result.value
      prices[sym] = {
        symbol: live.symbol,
        price: live.price,
        bid: live.bid,
        ask: live.ask,
        change_24h: change24hMap[sym] ?? null,
        volume: live.volume,
        market_cap: null,
        isHalted: live.isHalted,
        updatedAt: live.updatedAt,
      }
    } else {
      needsSupabase.push(sym)
    }
  }

  // Full Supabase fallback for symbols Robinhood couldn't serve
  if (needsSupabase.length > 0) {
    const supabase = await createClient()
    const { data: assets, error } = await supabase
      .from('assets')
      .select(`
        id, symbol,
        prices ( price, bid, ask, change_24h, volume_24h, market_cap, is_halted, recorded_at )
      `)
      .in('symbol', needsSupabase)
      .eq('is_active', true)
      .order('recorded_at', { ascending: false, referencedTable: 'prices' })
      .limit(1, { referencedTable: 'prices' })

    if (!error && assets) {
      for (const sym of needsSupabase) {
        const asset = (assets as AssetRow[]).find(a => a.symbol === sym)
        const p = asset?.prices?.[0]
        prices[sym] = p ? supabasePriceToShape(sym, p) : null
      }
    } else {
      for (const sym of needsSupabase) prices[sym] = null
    }
  }

  return ok({ prices })
}
