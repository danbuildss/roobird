import { createServiceClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'
import { fetchPrices } from '@/lib/adapters/robinhood/client'

// POST /api/v1/sync — called by cron-job.org every 15 min
// Bearer token must match CRON_SECRET or SYNC_SECRET env var
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET ?? process.env.SYNC_SECRET
  const auth = request.headers.get('authorization') ?? ''
  if (!secret || auth !== `Bearer ${secret}`) return Errors.unauthorized()

  const apiBase = process.env.ROBINHOOD_API_BASE_URL
  if (!apiBase) {
    return ok({ skipped: true, reason: 'ROBINHOOD_API_BASE_URL not configured — using seeded prices' })
  }

  const supabase = await createServiceClient()
  const startedAt = new Date().toISOString()

  // Open a sync_run record (best-effort — non-fatal if table doesn't exist yet)
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

    let inserted = 0
    let failed = 0
    if (rows.length) {
      const { error } = await supabase.from('prices').insert(rows)
      if (error) { failed = rows.length }
      else { inserted = rows.length }
    }

    await finishRun(failed > 0 && inserted === 0 ? 'failed' : 'completed', {
      assets_attempted: attempted,
      assets_updated: inserted,
      prices_inserted: inserted,
      failure_count: failed,
    })

    return ok({ synced: inserted, failed, symbols })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Robinhood API unavailable'
    await finishRun('failed', {
      assets_attempted: attempted,
      failure_count: attempted,
      error_summary: msg,
    })
    return ok({ synced: 0, failed: attempted, reason: msg })
  }
}

// GET /api/v1/sync — cron-job.org can call GET; delegate to POST logic
export async function GET(request: Request) {
  return POST(request)
}
