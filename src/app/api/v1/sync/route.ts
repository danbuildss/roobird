import { createServiceClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'
import { fetchPrices } from '@/lib/adapters/robinhood/client'

// POST /api/v1/sync — called by Vercel cron or manually
// Requires Authorization: Bearer <SYNC_SECRET>
export async function POST(request: Request) {
  const secret = process.env.SYNC_SECRET
  const auth = request.headers.get('authorization') ?? ''

  if (!secret || auth !== `Bearer ${secret}`) {
    return Errors.unauthorized()
  }

  const apiBase = process.env.ROBINHOOD_API_BASE_URL
  if (!apiBase) {
    return ok({ skipped: true, reason: 'ROBINHOOD_API_BASE_URL not configured — using seeded prices' })
  }

  const supabase = await createServiceClient()

  const { data: assetRows, error: assetErr } = await supabase
    .from('assets')
    .select('id, symbol')
    .eq('is_active', true)

  if (assetErr || !assetRows?.length) return Errors.internal()

  const symbols = assetRows.map(a => a.symbol)
  const symbolToId = Object.fromEntries(assetRows.map(a => [a.symbol, a.id]))

  let fetched = 0
  let failed = 0

  try {
    const prices = await fetchPrices(symbols)
    const rows = prices
      .filter(p => symbolToId[p.symbol])
      .map(p => ({
        asset_id: symbolToId[p.symbol],
        price: p.price,
        bid: p.bid,
        ask: p.ask,
        is_halted: p.isHalted,
      }))

    if (rows.length) {
      const { error } = await supabase.from('prices').insert(rows)
      if (error) { failed = rows.length }
      else { fetched = rows.length }
    }
  } catch (err) {
    return ok({
      synced: 0,
      failed: symbols.length,
      reason: err instanceof Error ? err.message : 'Robinhood API unavailable',
    })
  }

  return ok({ synced: fetched, failed, symbols })
}

// GET /api/v1/sync — Vercel cron calls GET; delegate to POST logic
export async function GET(request: Request) {
  // Vercel cron sends the request with CRON_SECRET in the Authorization header
  // Remap to same POST handler behaviour
  return POST(request)
}
