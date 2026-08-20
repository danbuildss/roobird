import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
  const cursor = searchParams.get('cursor')

  const supabase = await createClient()

  let query = supabase
    .from('assets')
    .select(`
      id, symbol, name, token_address, chain_id, underlying,
      asset_type, logo_url, is_active, source_adapter, created_at,
      prices ( price, bid, ask, change_24h, volume_24h, market_cap, is_halted, recorded_at )
    `)
    .eq('is_active', true)
    .order('symbol')
    .limit(limit)

  if (type) query = query.eq('asset_type', type)
  if (cursor) query = query.gt('symbol', cursor)

  const { data, error } = await query

  if (error) return Errors.internal()

  const nextCursor = data.length === limit ? data[data.length - 1].symbol : null

  return ok({ assets: data, next_cursor: nextCursor })
}
