import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const type   = searchParams.get('type')
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50)

  const supabase = await createClient()

  let query = supabase
    .from('market_events')
    .select('id, symbol, event_type, headline, detail, magnitude, direction, occurred_at')
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (symbol) query = query.eq('symbol', symbol.toUpperCase())
  if (type)   query = query.eq('event_type', type)

  const { data, error } = await query
  if (error) return Errors.internal()

  return ok({ events: data })
}
