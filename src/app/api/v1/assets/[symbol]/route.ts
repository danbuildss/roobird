import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assets')
    .select(`
      id, symbol, name, token_address, chain_id, underlying,
      asset_type, logo_url, is_active, source_adapter, created_at,
      prices ( price, bid, ask, change_24h, change_7d, volume_24h, market_cap, is_halted, recorded_at ),
      provider_assets (
        execution_method, deep_link_template, supported_network,
        execution_partners ( provider_key, name, description, logo_url, website_url, capabilities )
      )
    `)
    .eq('symbol', symbol.toUpperCase())
    .eq('is_active', true)
    .order('recorded_at', { ascending: false, referencedTable: 'prices' })
    .limit(1, { referencedTable: 'prices' })
    .single()

  if (error || !data) return Errors.notFound(`Asset ${symbol} not found`)
  return ok(data)
}
