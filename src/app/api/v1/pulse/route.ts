import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

const EPOCH = '1970-01-01T00:00:00Z'

// GET /api/v1/pulse?limit=N
// Returns market_pulse rows with real data (updated at least once), newest first
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') ?? '10'), 20)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('market_pulse')
    .select('symbol, sentiment, sentiment_score, summary, themes, updated_at')
    .gt('updated_at', EPOCH)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) return Errors.internal()
  return ok(data ?? [])
}
