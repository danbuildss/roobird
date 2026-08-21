export const ROBINHOOD_CHAIN_ID = 4663
export const V1_STOCK_SYMBOLS = new Set(['NVDA', 'AAPL', 'TSLA'])

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/

export const isAllowedSymbol = (value: string) => V1_STOCK_SYMBOLS.has(value.toUpperCase())
export const isEvmAddress = (value: string) => EVM_ADDRESS.test(value)

export function isPositiveDecimal(value: string) {
  if (!/^\d+(?:\.\d{1,6})?$/.test(value)) return false
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 && amount <= 1_000_000
}
