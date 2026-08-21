import type { RobinhoodAsset, RobinhoodPrice } from '@/types'

const BASE_URL = process.env.ROBINHOOD_API_BASE_URL ?? 'https://api.robinhood.com/rhj'

async function robinhoodFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 15 },
  })

  if (!res.ok) {
    throw new Error(`Robinhood API error ${res.status} on ${path}`)
  }

  return res.json() as Promise<T>
}

interface RawDeployment {
  contractAddress: string
  chainId: number
  networkName: string
}

interface RawAsset {
  tokenSymbol: string
  tokenName: string
  deployments: RawDeployment[]
  logoUrl: string | null
  status: string
  currentMultiplier: string
}

interface RawPrice {
  tokenSymbol: string
  bid: string
  ask: string
  dailyTradingVolume: string
  isTradingHalt: boolean
  generatedAt: string
}

interface RawCorporateAction {
  symbol: string
  type: string
  multiplier: number
  effective_date: string
}

function requireFinite(value: string, field: string, symbol: string): number {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Robinhood returned invalid ${field} for ${symbol}`)
  }
  return parsed
}

export async function fetchAssets(): Promise<RobinhoodAsset[]> {
  const raw = await robinhoodFetch<{ assets?: RawAsset[] }>('/assets')
  const assets = Array.isArray(raw.assets) ? raw.assets : []

  return assets.flatMap((asset) => {
    const deployment = asset.deployments?.find((item) => item.chainId === 4663) ?? asset.deployments?.[0]
    if (!asset.tokenSymbol || !deployment?.contractAddress) return []

    const normalizedStatus: RobinhoodAsset['status'] = asset.status === 'ASSET_STATUS_ACTIVE'
      ? 'active'
      : asset.status.includes('HALT')
        ? 'halted'
        : 'inactive'

    return [{
      symbol: asset.tokenSymbol,
      name: asset.tokenName,
      contractAddress: deployment.contractAddress,
      logoUrl: asset.logoUrl ?? null,
      status: normalizedStatus,
      corporateActionMultiplier: Number.parseFloat(asset.currentMultiplier) || 1,
    }]
  })
}

export async function fetchPrice(symbol: string): Promise<RobinhoodPrice> {
  const normalizedSymbol = symbol.trim().toUpperCase()
  const raw = await robinhoodFetch<{ quotes?: RawPrice[] }>(`/prices/${encodeURIComponent(normalizedSymbol)}`)
  const quote = raw.quotes?.find((item) => item.tokenSymbol === normalizedSymbol) ?? raw.quotes?.[0]

  if (!quote) {
    throw new Error(`Robinhood returned no quote for ${normalizedSymbol}`)
  }

  const bid = requireFinite(quote.bid, 'bid', normalizedSymbol)
  const ask = requireFinite(quote.ask, 'ask', normalizedSymbol)

  return {
    symbol: quote.tokenSymbol,
    bid,
    ask,
    price: (bid + ask) / 2,
    volume: Number.parseFloat(quote.dailyTradingVolume) || 0,
    isHalted: quote.isTradingHalt,
    updatedAt: quote.generatedAt,
  }
}

export async function fetchPrices(symbols: string[]): Promise<RobinhoodPrice[]> {
  return Promise.all(symbols.map(fetchPrice))
}

export async function fetchCorporateActions(): Promise<RawCorporateAction[]> {
  const raw = await robinhoodFetch<{ results?: RawCorporateAction[]; corporateActions?: RawCorporateAction[] }>('/corporate-actions')
  return raw.results ?? raw.corporateActions ?? []
}
