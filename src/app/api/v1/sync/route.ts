import { createServiceClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'
import { fetchAssets, fetchPrice } from '@/lib/adapters/robinhood/client'

// POST /api/v1/sync — called by Vercel cron or manually
// Vercel sets CRON_SECRET automatically; SYNC_SECRET is a manual fallback
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET ?? process.env.SYNC_SECRET
  const auth = request.headers.get('authorization') ?? ''

  if (!secret || auth !== `Bearer ${secret}`) {
    return Errors.unauthorized()
  }

  const apiBase = process.env.ROBINHOOD_API_BASE_URL
  if (!apiBase) {
    return ok({ skipped: true, reason: 'ROBINHOOD_API_BASE_URL not configured — using seeded prices' })
  }

  const supabase = await createServiceClient()

  // Upsert full asset list from Robinhood so the DB grows beyond seeded rows
  let robinhoodAssets: Awaited<ReturnType<typeof fetchAssets>> = []
  try {
    robinhoodAssets = await fetchAssets()
    if (robinhoodAssets.length > 0) {
      const assetUpsertRows = robinhoodAssets.map(a => ({
        symbol: a.symbol,
        name: a.name,
        contract_address: a.contractAddress,
        logo_url: a.logoUrl,
        is_active: a.status === 'active',
      }))
      await supabase.from('assets').upsert(assetUpsertRows, { onConflict: 'symbol', ignoreDuplicates: false })
    }
  } catch {
    // Non-fatal: fall back to existing DB assets
  }

  const { data: assetRows, error: assetErr } = await supabase
    .from('assets')
    .select('id, symbol')
    .eq('is_active', true)

  if (assetErr || !assetRows?.length) return Errors.internal()

  const symbols = assetRows.map(a => a.symbol)
  const symbolToId = Object.fromEntries(assetRows.map(a => [a.symbol, a.id]))

  let fetched = 0
  let failed = 0

  // Use allSettled so one bad symbol doesn't kill the whole sync
  const results = await Promise.allSettled(symbols.map(sym => fetchPrice(sym)))
  const rows: { asset_id: string; price: number; bid: number; ask: number; is_halted: boolean }[] = []

  for (let i = 0; i < symbols.length; i++) {
    const result = results[i]
    const sym = symbols[i]
    if (result.status === 'fulfilled') {
      const p = result.value
      if (symbolToId[sym]) {
        rows.push({
          asset_id: symbolToId[sym],
          price: p.price,
          bid: p.bid,
          ask: p.ask,
          is_halted: p.isHalted,
        })
      }
    } else {
      failed++
    }
  }

  if (rows.length) {
    const { error } = await supabase.from('prices').insert(rows)
    if (error) { failed += rows.length }
    else { fetched = rows.length }
  }

  return ok({ synced: fetched, failed, upserted_assets: robinhoodAssets.length, symbols })
}

// GET /api/v1/sync — Vercel cron calls GET; delegate to POST logic
export async function GET(request: Request) {
  // Vercel cron sends the request with CRON_SECRET in the Authorization header
  // Remap to same POST handler behaviour
  return POST(request)
}
