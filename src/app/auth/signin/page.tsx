'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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
      window.location.href = '/'
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

      window.location.href = '/'
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wallet sign-in failed')
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Roobird</div>
        <h1 style={styles.heading}>Sign in</h1>

        <button onClick={handleWalletSignIn} disabled={loading} style={styles.walletBtn}>
          {loading ? 'Connecting…' : 'Connect Wallet'}
        </button>

        <div style={styles.divider}><span>or</span></div>

        <form onSubmit={handleEmailSignIn}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="you@example.com"
          />
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            placeholder="••••••••"
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={styles.footer}>
          No account?{' '}
          <Link href="/auth/signup" style={styles.link}>Create one</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--background)',
    padding: '1.5rem',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '2rem',
  },
  logo: {
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    marginBottom: '1.5rem',
  },
  heading: {
    fontSize: '22px',
    fontWeight: 600,
    color: 'var(--foreground)',
    marginBottom: '1.5rem',
  },
  walletBtn: {
    width: '100%',
    padding: '0.625rem 1rem',
    backgroundColor: 'var(--foreground)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  divider: {
    textAlign: 'center',
    color: 'var(--muted)',
    fontSize: '12px',
    margin: '1rem 0',
    position: 'relative',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--foreground)',
    marginBottom: '0.375rem',
    marginTop: '0.875rem',
  },
  input: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    fontSize: '14px',
    color: 'var(--foreground)',
    backgroundColor: 'var(--surface)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  submitBtn: {
    width: '100%',
    padding: '0.625rem 1rem',
    backgroundColor: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '1.25rem',
  },
  error: {
    fontSize: '13px',
    color: 'var(--red)',
    marginTop: '0.5rem',
  },
  footer: {
    fontSize: '13px',
    color: 'var(--muted)',
    textAlign: 'center',
    marginTop: '1.25rem',
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'none',
  },
}
