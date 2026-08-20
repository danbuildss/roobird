import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

export async function GET() {
  const supabase = await createClient()

  // Count public theses per asset symbol
  const { data, error } = await supabase
    .from('theses')
    .select(`
      assets ( symbol )
    `)
    .eq('visibility', 'public')

  if (error) return Errors.internal()

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const sym = (row.assets as unknown as { symbol: string } | null)?.symbol
    if (sym) counts[sym] = (counts[sym] ?? 0) + 1
  }

  return ok({ counts })
}
