import { createServiceClient } from '@/lib/supabase/server'
import { fetchAssets, fetchPrices } from './client'

export async function syncAssets() {
  const supabase = await createServiceClient()
  const assets = await fetchAssets()

  const rows = assets.map((a) => ({
    symbol: a.symbol,
    name: a.name,
    token_address: a.contractAddress,
    logo_url: a.logoUrl,
    is_active: a.status === 'active',
    source_adapter: 'robinhood',
    asset_type: 'stock' as const, // ETF distinction resolved separately
  }))

  const { error } = await supabase
    .from('assets')
    .upsert(rows, { onConflict: 'symbol' })

  if (error) throw error
  return rows.length
}

export async function syncPrices(symbols: string[]) {
  const supabase = await createServiceClient()
  const prices = await fetchPrices(symbols)

  const assetQuery = await supabase
    .from('assets')
    .select('id, symbol')
    .in('symbol', symbols)

  if (assetQuery.error) throw assetQuery.error

  const symbolToId = Object.fromEntries(
    assetQuery.data.map((a) => [a.symbol, a.id]),
  )

  const rows = prices
    .filter((p) => symbolToId[p.symbol])
    .map((p) => ({
      asset_id: symbolToId[p.symbol],
      price: p.price,
      bid: p.bid,
      ask: p.ask,
      is_halted: p.isHalted,
    }))

  const { error } = await supabase.from('prices').insert(rows)
  if (error) throw error
  return rows.length
}
