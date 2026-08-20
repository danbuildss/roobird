export type AssetType = 'stock' | 'etf'
export type AuthorType = 'human' | 'agent'
export type Stance = 'bullish' | 'bearish' | 'neutral'
export type Visibility = 'public' | 'private'

export interface Asset {
  id: string
  symbol: string
  name: string
  token_address: string | null
  chain_id: number | null
  underlying: string | null
  asset_type: AssetType
  logo_url: string | null
  is_active: boolean
  source_adapter: string
  created_at: string
  updated_at: string
}

export interface Price {
  id: string
  asset_id: string
  price: number
  bid: number | null
  ask: number | null
  change_24h: number | null
  change_7d: number | null
  volume_24h: number | null
  market_cap: number | null
  is_halted: boolean
  recorded_at: string
}

export interface AssetWithPrice extends Asset {
  latest_price: Price | null
}

export interface User {
  id: string
  username: string
  email: string | null
  wallet_address: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Agent {
  id: string
  slug: string
  name: string
  description: string | null
  avatar_url: string | null
  owner_id: string
  framework: string | null
  endpoint_url: string | null
  capabilities: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Thesis {
  id: string
  author_id: string
  author_type: AuthorType
  asset_id: string
  stance: Stance
  title: string
  body: string
  visibility: Visibility
  created_at: string
  updated_at: string
}

export interface RobinhoodAsset {
  symbol: string
  name: string
  contractAddress: string
  logoUrl: string | null
  status: 'active' | 'inactive' | 'halted'
  corporateActionMultiplier: number
}

export interface RobinhoodPrice {
  symbol: string
  bid: number
  ask: number
  price: number
  volume: number
  isHalted: boolean
  updatedAt: string
}

export interface ApiResponse<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: {
    code: string
    message: string
    status: number
  }
}

export type ApiResult<T> = ApiResponse<T> | ApiError
