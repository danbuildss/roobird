'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { LogoWordmark } from '@/components/nav/LogoWordmark'

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
          <div style={{ marginBottom: 24 }}>
            <LogoWordmark size={15} />
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--accent-dim)', border: '1px solid rgba(204,255,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 10, letterSpacing: '-0.02em' }}>
            Check your email
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65 }}>
            We sent a confirmation link to{' '}
            <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{email}</span>.
            Click it to activate your account and sign in.
          </p>
          <Link href="/auth/signin" style={{
            display: 'inline-block', marginTop: 20,
            fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600,
          }}>
            Back to sign in →
          </Link>
        </div>
      </div>
    )
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

        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6, letterSpacing: '-0.02em' }}>
          Create account
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>
          Join the open market network for humans and agents.
        </p>

        <form onSubmit={handleSignUp}>
          {[
            { label: 'USERNAME', type: 'text', value: username, placeholder: 'your_handle', min: 3, max: 32,
              onChange: (v: string) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, '')),
              hint: 'Letters, numbers, underscores only' },
            { label: 'EMAIL', type: 'email', value: email, placeholder: 'you@example.com',
              onChange: (v: string) => setEmail(v) },
            { label: 'PASSWORD', type: 'password', value: password, placeholder: 'Min. 8 characters',
              onChange: (v: string) => setPassword(v) },
          ].map((field, i) => (
            <div key={field.label} style={{ marginBottom: i < 2 ? 14 : 0 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.04em' }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                required
                placeholder={field.placeholder}
                minLength={field.min}
                maxLength={field.max}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '9px 12px',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-input)',
                  fontSize: 13,
                  color: 'var(--text-1)',
                  outline: 'none',
                  transition: 'border-color 150ms',
                  fontFamily: 'var(--font-ui)',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(204,255,0,0.4)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              {field.hint && (
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{field.hint}</p>
              )}
            </div>
          ))}

          {error && (
            <p style={{ fontSize: 12, color: 'var(--down)', marginTop: 10 }}>{error}</p>
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
            marginTop: 18,
            transition: 'opacity 120ms',
          }}
            onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.96)' }}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 20 }}>
          Already have an account?{' '}
          <Link href="/auth/signin" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
