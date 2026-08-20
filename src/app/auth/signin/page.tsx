'use client'

import { useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogoWordmark } from '@/components/nav/LogoWordmark'

export default function SignInPage() {
  const { ready, authenticated, login } = usePrivy()
  const router = useRouter()

  useEffect(() => {
    if (ready && authenticated) {
      router.replace('/explore')
    }
  }, [ready, authenticated, router])

  useEffect(() => {
    if (ready && !authenticated) {
      login()
    }
  }, [ready, authenticated, login])

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
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'var(--text-1)' }}>
            <LogoWordmark size={15} />
          </Link>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12, letterSpacing: '-0.02em' }}>
          Sign in
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 28, lineHeight: 1.5 }}>
          Continue with X, email, or a wallet.
        </p>

        {ready ? (
          <button
            onClick={login}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--accent)',
              color: 'var(--accent-text)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'opacity 120ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Connect
          </button>
        ) : (
          <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading…</div>
        )}
      </div>
    </div>
  )
}
