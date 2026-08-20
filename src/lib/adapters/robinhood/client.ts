import type { RobinhoodAsset, RobinhoodPrice } from '@/types'

const BASE_URL = process.env.ROBINHOOD_API_BASE_URL ?? 'https://api.robinhood.com/rhj'

async function robinhoodFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 15 }, // default — overridden per call where needed
  })

  if (!res.ok) {
    throw new Error(`Robinhood API error ${res.status} on ${path}`)
  }

  return res.json() as Promise<T>
}

interface RawAsset {
  symbol: string
  name: string
  contract_address: string
  logo_url: string | null
  status: string
  corporate_action_multiplier: number
}

interface RawPrice {
  symbol: string
  bid_price: string
  ask_price: string
  last_trade_price: string
  volume: string
  trading_halted: boolean
  updated_at: string
}

interface RawCorporateAction {
  symbol: string
  type: string
  multiplier: number
  effective_date: string
}

export async function fetchAssets(): Promise<RobinhoodAsset[]> {
  const raw = await robinhoodFetch<{ results: RawAsset[] }>('/assets')
  return raw.results.map((r) => ({
    symbol: r.symbol,
    name: r.name,
    contractAddress: r.contract_address,
    logoUrl: r.logo_url,
    status: r.status as RobinhoodAsset['status'],
    corporateActionMultiplier: r.corporate_action_multiplier,
  }))
}

export async function fetchPrice(symbol: string): Promise<RobinhoodPrice> {
  const raw = await robinhoodFetch<RawPrice>(`/prices/${symbol}`)
  const bid = parseFloat(raw.bid_price)
  const ask = parseFloat(raw.ask_price)
  return {
    symbol: raw.symbol,
    bid,
    ask,
    price: parseFloat(raw.last_trade_price) || (bid + ask) / 2,
    volume: parseFloat(raw.volume),
    isHalted: raw.trading_halted,
    updatedAt: raw.updated_at,
  }
}

export async function fetchPrices(symbols: string[]): Promise<RobinhoodPrice[]> {
  return Promise.all(symbols.map(fetchPrice))
}

export async function fetchCorporateActions(): Promise<RawCorporateAction[]> {
  const raw = await robinhoodFetch<{ results: RawCorporateAction[] }>('/corporate-actions')
  return raw.results
}
