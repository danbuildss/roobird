export const EXECUTION_CAPABILITIES = [
  'external_handoff',
  'intent_deeplink',
  'quote',
  'unsigned_transaction',
  'provider_wallet_execution',
  'execution_status',
] as const

export type ExecutionCapability = typeof EXECUTION_CAPABILITIES[number]
export type ExecutionMode = 'external_handoff' | 'unsigned_transaction' | 'provider_wallet_execution'
export type ExecutionStatus =
  | 'preparing'
  | 'awaiting_signature'
  | 'submitting'
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'cancelled'
  | 'external_handoff'

export interface ExecutionRequest {
  symbol: string
  assetId: string
  sourceWallet: string
  destinationWallet: string
  requestedAmount: string
}

export type PreparedExecution =
  | { mode: 'external_handoff'; url: string; providerReference?: string }
  | {
      mode: 'unsigned_transaction'
      chainId: number
      to: `0x${string}`
      data: `0x${string}`
      value: string
      providerReference?: string
    }

export interface ExecutionProvider {
  id: string
  name: string
  capabilities: readonly ExecutionCapability[]
  prepare(request: ExecutionRequest): Promise<PreparedExecution>
}
