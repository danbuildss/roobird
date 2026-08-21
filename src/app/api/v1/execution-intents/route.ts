import { createClient } from '@/lib/supabase/server'
import { Errors, err, ok } from '@/lib/api/response'
import { bankrProvider } from '@/lib/execution/providers/bankr'
import { executionRateLimited } from '@/lib/execution/rate-limit'
import { isAllowedSymbol, isEvmAddress, isPositiveDecimal, ROBINHOOD_CHAIN_ID } from '@/lib/execution/validation'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Errors.unauthorized()
  if (executionRateLimited(user.id)) return err('rate_limited', 'Too many execution requests', 429)

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return Errors.badRequest('Invalid JSON body') }

  const assetId = typeof body.asset_id === 'string' ? body.asset_id : ''
  const symbol = typeof body.symbol === 'string' ? body.symbol.toUpperCase() : ''
  const sourceWallet = typeof body.source_wallet === 'string' ? body.source_wallet.toLowerCase() : ''
  const destinationWallet = typeof body.destination_wallet === 'string' ? body.destination_wallet.toLowerCase() : ''
  const requestedAmount = typeof body.requested_amount === 'string' ? body.requested_amount : ''

  if (!assetId || !isAllowedSymbol(symbol)) return Errors.badRequest('Asset is not enabled for V1 execution')
  if (!isEvmAddress(sourceWallet) || !isEvmAddress(destinationWallet)) return Errors.badRequest('A valid connected wallet is required')
  if (sourceWallet !== destinationWallet) return Errors.badRequest('V1 destination must match the connected wallet')
  if (!isPositiveDecimal(requestedAmount)) return Errors.badRequest('Enter a valid amount')

  const { data: asset } = await supabase.from('assets').select('id, symbol, chain_id, is_active').eq('id', assetId).eq('symbol', symbol).eq('is_active', true).single()
  if (!asset || asset.chain_id !== ROBINHOOD_CHAIN_ID) return Errors.badRequest('Asset/network validation failed')

  const { data: provider } = await supabase.from('execution_partners').select('id').eq('provider_key', 'bankr').eq('is_active', true).single()
  if (!provider) return err('provider_unavailable', 'Bankr execution is not configured', 503)

  const { data: mapping } = await supabase.from('provider_assets').select('id').eq('provider_id', provider.id).eq('asset_id', assetId).single()
  if (!mapping) return Errors.badRequest('This asset is not enabled for Bankr execution')

  const prepared = await bankrProvider.prepare({ symbol, assetId, sourceWallet, destinationWallet, requestedAmount })
  const status = prepared.mode === 'external_handoff' ? 'external_handoff' : 'preparing'
  const { data: intent, error } = await supabase.from('execution_intents').insert({
    user_id: user.id,
    asset_id: assetId,
    provider_id: provider.id,
    execution_mode: prepared.mode,
    source_wallet: sourceWallet,
    destination_wallet: destinationWallet,
    requested_amount: requestedAmount,
    provider_reference: prepared.providerReference ?? null,
    status,
  }).select('id, execution_mode, requested_amount, estimated_output, transaction_hash, status, created_at, updated_at').single()

  if (error || !intent) {
    console.error('execution_intent_create_failed', { userId: user.id, assetId, provider: 'bankr', code: error?.code })
    return Errors.internal()
  }

  console.info('execution_intent_created', { intentId: intent.id, userId: user.id, assetId, mode: prepared.mode })
  return ok({
    intent,
    execution: prepared,
    provider: { id: 'bankr', name: 'Bankr', capabilities: bankrProvider.capabilities },
    network: { name: 'Robinhood Chain', chainId: ROBINHOOD_CHAIN_ID },
  }, 201)
}
