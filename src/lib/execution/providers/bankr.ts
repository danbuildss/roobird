import type { ExecutionProvider } from '@/lib/execution/types'

// V1 is deliberately handoff-only. Connected-wallet signing stays disabled
// until a documented Bankr Stock Token API returns a verifiable unsigned tx.
export const bankrProvider: ExecutionProvider = {
  id: 'bankr',
  name: 'Bankr',
  capabilities: ['external_handoff'],
  async prepare() {
    return { mode: 'external_handoff', url: 'https://bankr.bot' }
  },
}
