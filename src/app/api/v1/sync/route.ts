import { createServiceClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'
import { fetchAssets, fetchPrice } from '@/lib/adapters/robinhood/client'

// POST /api/v1/sync — called by cron-job.org every 15 min
// Bearer token must match CRON_SECRET or SYNC_SECRET env var
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET ?? process.env.SYNC_SECRET
  const auth = request.headers.get('authorization') ?? ''
  if (!secret || auth !== `Bearer ${secret}`) return Errors.unauthorized()

  const supabase = await createServiceClient()
  const startedAt = new Date().toISOString()

  let runId: string | undefined
  try {
    const { data: runRow } = await supabase
      .from('sync_runs')
      .insert({ status: 'running', started_at: startedAt })
      .select('id')
      .single()
    runId = runRow?.id
  } catch { /* table may not exist in older deploys */ }

  const finishRun = async (
    status: 'completed' | 'failed' | 'skipped',
    metrics: {
      assets_attempted?: number
      assets_updated?: number
      prices_inserted?: number
      failure_count?: number
      error_summary?: string
    }
  ) => {
    if (!runId) return
    try {
      const completedAt = new Date().toISOString()
      const durationMs = Date.now() - new Date(startedAt).getTime()
      await supabase.from('sync_runs').update({
        status, completed_at: completedAt, duration_ms: durationMs, ...metrics,
      }).eq('id', runId)
    } catch { /* non-fatal */ }
  }

  let robinhoodAssets: Awaited<ReturnType<typeof fetchAssets>> = []
  try {
    robinhoodAssets = await fetchAssets()
    if (robinhoodAssets.length > 0) {
      const assetUpsertRows = robinhoodAssets.map(a => ({
        symbol: a.symbol,
        name: a.name,
        token_address: a.contractAddress,
        chain_id: 4663,
        underlying: a.symbol,
        asset_type: 'stock',
        logo_url: a.logoUrl,
        source_adapter: 'robinhood',
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

  if (assetErr || !assetRows?.length) {
    await finishRun('failed', { error_summary: 'Failed to fetch assets from database' })
    return Errors.internal()
  }

  const symbols = assetRows.map(a => a.symbol)
  const symbolToId = Object.fromEntries(assetRows.map(a => [a.symbol, a.id]))
  const attempted = symbols.length

  // Find the closest stored snapshot at or before 24h ago.
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: history } = await supabase.from('prices')
    .select('asset_id, price, recorded_at')
    .in('asset_id', assetRows.map(a => a.id))
    .lte('recorded_at', cutoff)
    .order('recorded_at', { ascending: false })
    .limit(Math.min(Math.max(assetRows.length * 4, 200), 5000))
  const reference = new Map<string, number>()
  for (const row of history ?? []) {
    if (!reference.has(row.asset_id)) reference.set(row.asset_id, Number(row.price))
  }

  const results = await Promise.allSettled(symbols.map(sym => fetchPrice(sym)))
  const rows: { asset_id: string; price: number; bid: number; ask: number; change_24h: number | null; volume_24h: number; is_halted: boolean }[] = []

  let fetched = 0
  let failed = 0

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
          change_24h: reference.get(symbolToId[sym])
            ? ((p.price - reference.get(symbolToId[sym])!) / reference.get(symbolToId[sym])!) * 100
            : null,
          volume_24h: p.volume,
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

  await finishRun(fetched === 0 && failed > 0 ? 'failed' : 'completed', {
    assets_attempted: attempted,
    assets_updated: robinhoodAssets.length,
    prices_inserted: fetched,
    failure_count: failed,
  })

  return ok({ synced: fetched, failed, upserted_assets: robinhoodAssets.length, symbols })
}

export async function GET(request: Request) {
  return POST(request)
}
