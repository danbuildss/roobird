'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>Roobird</div>
          <h1 style={styles.heading}>Check your email</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Roobird</div>
        <h1 style={styles.heading}>Create account</h1>

        <form onSubmit={handleSignUp}>
          <label style={styles.label}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            required
            style={styles.input}
            placeholder="your_handle"
            minLength={3}
            maxLength={32}
          />
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
            placeholder="Min. 8 characters"
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link href="/auth/signin" style={styles.link}>Sign in</Link>
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
