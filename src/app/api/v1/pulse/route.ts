import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

// GET /api/v1/pulse?limit=N
// Return seeded whitelist rows during cold start; symbol pages replace them with live Grok data.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '10'), 1), 20)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('market_pulse')
    .select('symbol, sentiment, sentiment_score, summary, themes, updated_at')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) return Errors.internal()
  return ok(data ?? [])
}
