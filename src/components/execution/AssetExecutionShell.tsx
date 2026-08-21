'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { ArrowUpRight } from 'lucide-react'
import { AssetView } from '@/components/asset/AssetView'
import { BuyFlow } from '@/components/execution/BuyFlow'

type AssetExecutionMeta = {
  id: string
  name: string
  chain_id: number | null
  provider_assets?: {
    execution_method: string
    supported_network: string | null
    execution_partners: {
      provider_key: string | null
      name: string
      capabilities: string[]
    } | null
  }[]
}

type LivePrice = { price: number }

export function AssetExecutionShell({ symbol }: { symbol: string }) {
  const { ready, authenticated, login, connectWallet, user } = usePrivy()
  const [asset, setAsset] = useState<AssetExecutionMeta | null>(null)
  const [price, setPrice] = useState(0)
  const [buyOpen, setBuyOpen] = useState(false)
  const wallet = user?.wallet?.address ?? null

  useEffect(() => {
    let active = true
    Promise.all([
      fetch(`/api/v1/assets/${symbol}`).then(response => response.json()),
      fetch(`/api/v1/prices/${symbol}`).then(response => response.json()),
    ]).then(([assetPayload, pricePayload]) => {
      if (!active) return
      setAsset(assetPayload.data ?? null)
      setPrice(Number((pricePayload.data as LivePrice | undefined)?.price ?? 0))
    }).catch(() => {})
    return () => { active = false }
  }, [symbol])

  const bankr = asset?.provider_assets?.find(item =>
    item.execution_partners?.provider_key === 'bankr' &&
    item.execution_partners.capabilities.includes('external_handoff'),
  )
  const supported = !!bankr && asset?.chain_id === 4663 && ['NVDA', 'AAPL', 'TSLA'].includes(symbol)

  async function openBuy() {
    if (!authenticated) { login(); return }
    if (!wallet) { await connectWallet(); return }
    setBuyOpen(true)
  }

  return (
    <>
      <AssetView symbol={symbol} />
      {supported && (
        <div className="execution-launcher">
          <button onClick={openBuy} disabled={!ready}>
            <span>{!authenticated ? `Sign in to buy ${symbol}` : !wallet ? `Connect wallet to buy ${symbol}` : `Buy ${symbol}`}</span>
            <ArrowUpRight size={15} strokeWidth={2} />
          </button>
          <small>Execution provided by Bankr</small>
        </div>
      )}
      {buyOpen && asset && wallet && (
        <BuyFlow
          assetId={asset.id}
          symbol={symbol}
          assetName={asset.name}
          price={price}
          wallet={wallet}
          onClose={() => setBuyOpen(false)}
        />
      )}
      <style jsx>{`
        .execution-launcher{position:fixed;right:24px;bottom:24px;z-index:80;display:grid;gap:6px;padding:10px;background:var(--surface);border:1px solid var(--border);border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.35)}
        .execution-launcher button{display:flex;align-items:center;justify-content:space-between;gap:20px;min-width:220px;padding:11px 14px;border:0;border-radius:8px;background:var(--accent);color:var(--accent-text);font-size:13px;font-weight:700;cursor:pointer}
        .execution-launcher button:disabled{opacity:.6;cursor:default}.execution-launcher small{padding:0 4px;font-size:10px;color:var(--text-3)}
        @media(max-width:768px){.execution-launcher{left:12px;right:12px;bottom:72px}.execution-launcher button{width:100%}}
      `}</style>
    </>
  )
}
