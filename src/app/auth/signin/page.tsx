'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { LogoWordmark } from '@/components/nav/LogoWordmark'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = '/explore'
    }
  }

  async function handleWalletSignIn() {
    setError('')
    setLoading(true)

    try {
      const { ethereum } = window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }
      if (!ethereum) {
        setError('No wallet detected. Install MetaMask or another Ethereum wallet.')
        setLoading(false)
        return
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[]
      const address = accounts[0]

      const { nonce } = await fetch('/api/auth/siwe/nonce').then((r) => r.json())

      const message = [
        'Roobird wants you to sign in with your Ethereum account:',
        address,
        '',
        'Sign in to Roobird — The open market network for humans and agents.',
        '',
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join('\n')

      const signature = await ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      }) as string

      const res = await fetch('/api/auth/siwe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error?.message ?? 'Wallet sign-in failed')
        setLoading(false)
        return
      }

      window.location.href = '/explore'
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wallet sign-in failed')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '32px',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'var(--text-1)' }}>
            <LogoWordmark size={15} />
          </Link>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 24, letterSpacing: '-0.02em' }}>
          Sign in
        </h1>

        {/* Wallet button */}
        <button onClick={handleWalletSignIn} disabled={loading} style={{
          width: '100%',
          padding: '10px 16px',
          background: 'var(--surface-raised)',
          color: 'var(--text-1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-pill)',
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: 16,
          transition: 'border-color 150ms',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = 'var(--text-3)' }}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12V22H4V12"/>
            <path d="M22 7H2v5h20V7z"/>
            <path d="M12 22V7"/>
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
          </svg>
          {loading ? 'Connecting…' : 'Connect Wallet'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailSignIn}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.04em' }}>
            EMAIL
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '9px 12px',
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              fontSize: 13,
              color: 'var(--text-1)',
              outline: 'none',
              marginBottom: 12,
              transition: 'border-color 150ms',
              fontFamily: 'var(--font-ui)',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(204,255,0,0.4)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.04em' }}>
            PASSWORD
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '9px 12px',
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              fontSize: 13,
              color: 'var(--text-1)',
              outline: 'none',
              marginBottom: 4,
              transition: 'border-color 150ms',
              fontFamily: 'var(--font-ui)',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(204,255,0,0.4)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />

          {error && (
            <p style={{ fontSize: 12, color: 'var(--down)', marginTop: 8, marginBottom: 0 }}>{error}</p>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%',
            padding: '10px 16px',
            background: loading ? 'var(--surface-raised)' : 'var(--accent)',
            color: loading ? 'var(--text-3)' : 'var(--accent-text)',
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 16,
            transition: 'opacity 120ms',
          }}
            onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.96)' }}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 20 }}>
          No account?{' '}
          <Link href="/auth/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
