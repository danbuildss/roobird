import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

export const revalidate = 15

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('symbols') ?? ''

  if (!raw) return Errors.badRequest('symbols param required')

  const symbols = raw
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 50)

  if (symbols.length === 0) return Errors.badRequest('no valid symbols')

  const supabase = await createClient()

  const { data: assets, error } = await supabase
    .from('assets')
    .select(`
      id, symbol,
      prices ( price, bid, ask, change_24h, volume_24h, market_cap, is_halted, recorded_at )
    `)
    .in('symbol', symbols)
    .eq('is_active', true)
    .order('recorded_at', { ascending: false, referencedTable: 'prices' })
    .limit(1, { referencedTable: 'prices' })

  if (error) return Errors.internal()

  type PriceRow = {
    price: number; bid: number | null; ask: number | null
    change_24h: number | null; volume_24h: number | null
    market_cap: number | null; is_halted: boolean; recorded_at: string
  }
  type AssetRow = { id: string; symbol: string; prices: PriceRow[] }

  const prices: Record<string, object | null> = {}
  for (const sym of symbols) {
    const asset = (assets as AssetRow[] | null)?.find(a => a.symbol === sym)
    const p = asset?.prices?.[0]
    if (!p) { prices[sym] = null; continue }
    prices[sym] = {
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

  return ok({ prices })
}
