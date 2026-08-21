'use client'

import { useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import type { ExecutionStatus } from '@/lib/execution/types'

type Step = 'amount' | 'review' | 'execution'
type Props = { assetId: string; symbol: string; assetName: string; price: number; wallet: string; onClose: () => void }
const short = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`

export function BuyFlow({ assetId, symbol, assetName, price, wallet, onClose }: Props) {
  const [step, setStep] = useState<Step>('amount')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<ExecutionStatus>('preparing')
  const [error, setError] = useState('')
  const estimated = price > 0 && Number(amount) > 0 ? Number(amount) / price : null
  const valid = /^\d+(?:\.\d{1,6})?$/.test(amount) && Number(amount) > 0

  async function continueWithBankr() {
    setStep('execution')
    setStatus('preparing')
    setError('')
    try {
      const response = await fetch('/api/v1/execution-intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: assetId, symbol, source_wallet: wallet, destination_wallet: wallet, requested_amount: amount }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error?.message ?? 'Unable to prepare execution')
      if (payload.data.execution.mode !== 'external_handoff') throw new Error('Unsupported execution response')
      setStatus('external_handoff')
      window.open(payload.data.execution.url, '_blank', 'noopener,noreferrer')
    } catch (cause) {
      setStatus('failed')
      setError(cause instanceof Error ? cause.message : 'Execution preparation failed')
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={`Buy ${symbol}`} className="buy-overlay" onMouseDown={event => { if (event.currentTarget === event.target) onClose() }}>
      <div className="buy-panel">
        <header className="buy-head">
          <div><strong>Buy {symbol}</strong><small>{assetName}</small></div>
          <button onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <main>
          {step === 'amount' && <>
            <Row label="Asset" value={`${symbol} · ${price > 0 ? `$${price.toFixed(2)}` : 'price unavailable'}`} />
            <Row label="Network" value="Robinhood Chain" />
            <Row label="Connected wallet" value={short(wallet)} />
            <Row label="Execution provider" value="Bankr" />
            <label>Amount to spend</label>
            <div className="buy-input"><span>$</span><input value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" autoFocus placeholder="0.00" /></div>
            <Action disabled={!valid} onClick={() => setStep('review')}>Review order</Action>
          </>}
          {step === 'review' && <>
            <Row label="Buy" value={symbol} />
            <Row label="Amount being spent" value={`$${Number(amount).toLocaleString()}`} />
            <Row label="Estimated received" value={estimated ? `≈ ${estimated.toFixed(6)} ${symbol}` : 'Unavailable'} />
            <Row label="Destination wallet" value={short(wallet)} />
            <Row label="Network" value="Robinhood Chain" />
            <Row label="Execution provider" value="Bankr" />
            <div className="buy-disclosure">Execution provided by Bankr. Roobird is not a broker, exchange, custodian, or execution venue. Eligibility is determined by the provider. This handoff does not confirm a purchase.</div>
            <Action onClick={continueWithBankr}>Continue with Bankr <ExternalLink size={14} /></Action>
            <button className="buy-secondary" onClick={() => setStep('amount')}>Back</button>
          </>}
          {step === 'execution' && <>
            <section className="buy-state">
              <strong>{status === 'preparing' ? 'Preparing handoff' : status === 'external_handoff' ? 'Continue with Bankr' : 'Unable to continue'}</strong>
              <p>{status === 'external_handoff' ? 'Bankr opened in a new tab. Roobird has not marked this as purchased because no verifiable transaction confirmation is available.' : error || 'Validating asset, network, wallet, and provider capability…'}</p>
            </section>
            {status === 'failed' && <><Action onClick={continueWithBankr}>Try again</Action><button className="buy-secondary" onClick={() => setStep('review')}>Back to review</button></>}
            {status === 'external_handoff' && <button className="buy-secondary" onClick={onClose}>Done</button>}
          </>}
        </main>
      </div>
      <style jsx>{`
        .buy-overlay{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.72);display:grid;place-items:center;padding:16px}.buy-panel{width:100%;max-width:460px;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:0 24px 80px rgba(0,0,0,.5)}.buy-head{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid var(--border)}.buy-head div{display:grid;gap:3px}.buy-head strong{font-size:15px;color:var(--text-1)}.buy-head small{font-size:11px;color:var(--text-3)}.buy-head button{border:0;background:transparent;color:var(--text-2);cursor:pointer}.buy-panel main{padding:18px}.buy-panel label{display:block;font-size:12px;color:var(--text-2);margin:18px 0 7px}.buy-input{display:flex;align-items:center;border:1px solid var(--border);border-radius:8px;padding:0 12px;background:var(--bg)}.buy-input span{color:var(--text-3)}.buy-input input{width:100%;padding:12px 8px;background:transparent;border:0;outline:0;color:var(--text-1);font-size:18px}.buy-disclosure{margin-top:16px;padding:12px;border-radius:8px;background:var(--surface-raised);font-size:11px;line-height:1.6;color:var(--text-2)}.buy-secondary{width:100%;margin-top:8px;padding:10px;border:1px solid var(--border);border-radius:8px;background:transparent;color:var(--text-2);cursor:pointer}.buy-state{padding:24px 0;text-align:center}.buy-state strong{font-size:15px;color:var(--text-1)}.buy-state p{font-size:11px;color:var(--text-3);line-height:1.6;margin-top:8px}
      `}</style>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '8px 0', fontSize: 12 }}><span style={{ color: 'var(--text-3)' }}>{label}</span><strong style={{ color: 'var(--text-1)', textAlign: 'right' }}>{value}</strong></div>
}

function Action({ children, onClick, disabled = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button disabled={disabled} onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 18, padding: '12px 14px', border: 0, borderRadius: 8, background: 'var(--accent)', color: 'var(--accent-text)', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1 }}>{children}</button>
}
