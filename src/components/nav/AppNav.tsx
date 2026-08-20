'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Compass,
  BarChart2,
  Bot,
  Code2,
  Search,
  Wallet,
  LogOut,
  ChevronRight,
  PenLine,
  Menu,
  X,
  Bell,
} from 'lucide-react'
import { LogoWordmark } from './LogoWordmark'
import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'

const NAV_ITEMS = [
  { href: '/explore',    label: 'Explore',    Icon: Compass   },
  { href: '/markets',    label: 'Markets',    Icon: BarChart2 },
  { href: '/agents',     label: 'Agents',     Icon: Bot       },
  { href: '/developers', label: 'Developers', Icon: Code2     },
]

export function AppNav() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { ready, authenticated, user, login, logout } = usePrivy()

  // Fetch unread notification count when authenticated
  useEffect(() => {
    if (!authenticated) { setUnreadCount(0); return }
    const fetchCount = () => {
      fetch('/api/v1/notifications?unread=true&limit=1')
        .then(r => r.json())
        .then(data => setUnreadCount(data.data?.unread_count ?? 0))
        .catch(() => {})
    }
    fetchCount()
    const interval = setInterval(fetchCount, 60000)
    return () => clearInterval(interval)
  }, [authenticated])

  const displayName = user?.twitter?.username
    ? `@${user.twitter.username}`
    : user?.email?.address
      ? user.email.address.split('@')[0]
      : user?.wallet?.address
        ? `${user.wallet.address.slice(0, 6)}…${user.wallet.address.slice(-4)}`
        : null

  // Close drawer when navigating
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function isActive(href: string) {
    if (href === '/explore') return pathname === '/explore' || pathname === '/'
    return pathname.startsWith(href)
  }

  const navContent = (
    <>
      {/* Logo */}
      <div style={{ padding: '22px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/explore" style={{ textDecoration: 'none', color: 'var(--text-1)' }}>
          <LogoWordmark size={15} />
        </Link>
        {/* Close button — only shown on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="nav-close-btn"
          style={{
            display: 'none',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-2)', padding: 4,
          }}
          aria-label="Close menu"
        >
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Nav items */}
      <div style={{ padding: '12px 12px 0', flex: 1 }}>
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                borderRadius: 8,
                textDecoration: 'none',
                color: active ? 'var(--text-1)' : 'var(--text-2)',
                background: active ? 'var(--surface-raised)' : 'transparent',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                marginBottom: 2,
                transition: 'background 120ms, color 120ms',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--surface-raised)'
                  e.currentTarget.style.color = 'var(--text-1)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-2)'
                }
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', left: 0, top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3, height: 18,
                  background: 'var(--accent)',
                  borderRadius: '0 2px 2px 0',
                }} />
              )}
              <Icon
                size={17}
                strokeWidth={active ? 2 : 1.5}
                style={{ color: active ? 'var(--accent)' : 'currentColor', flexShrink: 0 }}
              />
              {label}
            </Link>
          )
        })}
      </div>

      {/* Write button */}
      <div style={{ padding: '4px 12px 8px' }}>
        <button
          onClick={() => window.dispatchEvent(new Event('roobird:compose'))}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '9px 12px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(204,255,0,0.2)',
            borderRadius: 8, cursor: 'pointer',
            color: 'var(--accent)', fontSize: 14, fontWeight: 600,
            transition: 'opacity 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <PenLine size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
          Write
          <kbd style={{
            marginLeft: 'auto', fontSize: 10, color: 'rgba(204,255,0,0.5)',
            background: 'rgba(204,255,0,0.08)', border: '1px solid rgba(204,255,0,0.15)',
            borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--font-mono)',
          }}>⌘N</kbd>
        </button>
      </div>

      {/* Divider */}
      <div style={{ margin: '8px 20px', borderTop: '1px solid var(--border)' }} />

      {/* Notifications */}
      {authenticated && (
        <div style={{ padding: '0 12px 4px' }}>
          <button
            onClick={() => {}}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '9px 10px',
              background: 'transparent', border: 'none',
              borderRadius: 8, cursor: 'pointer',
              color: 'var(--text-2)', fontSize: 14, textAlign: 'left',
              transition: 'background 120ms, color 120ms',
              position: 'relative',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--surface-raised)'
              e.currentTarget.style.color = 'var(--text-1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-2)'
            }}
          >
            <Bell size={17} strokeWidth={1.5} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>Notifications</span>
            {unreadCount > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
                background: 'var(--accent)', color: 'var(--accent-text)',
                borderRadius: 9, display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', padding: '0 5px',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '0 12px 8px' }}>
        <button
          onClick={() => window.dispatchEvent(new Event('roobird:search'))}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '9px 10px',
            background: 'transparent', border: 'none',
            borderRadius: 8, cursor: 'pointer',
            color: 'var(--text-2)', fontSize: 14, textAlign: 'left',
            transition: 'background 120ms, color 120ms',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--surface-raised)'
            e.currentTarget.style.color = 'var(--text-1)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-2)'
          }}
        >
          <Search size={17} strokeWidth={1.5} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>Search</span>
          <kbd style={{
            fontSize: 10, color: 'var(--text-3)',
            background: 'var(--surface-raised)', border: '1px solid var(--border)',
            borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--font-mono)',
          }}>⌘K</kbd>
        </button>
      </div>

      {/* Connect / profile */}
      <div style={{ padding: '8px 12px 20px' }}>
        {ready && authenticated && displayName ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{
              padding: '8px 12px',
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--text-1)',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {displayName}
            </div>
            <button
              onClick={() => logout()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 12px',
                background: 'transparent', border: '1px solid var(--border)',
                borderRadius: 8, cursor: 'pointer',
                color: 'var(--text-3)', fontSize: 12,
                transition: 'color 120ms, border-color 120ms',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-1)'
                e.currentTarget.style.borderColor = 'var(--text-3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-3)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              <LogOut size={13} strokeWidth={1.5} />
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => login()}
            disabled={!ready}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '9px 12px',
              background: 'var(--accent-dim)', border: '1px solid rgba(204,255,0,0.2)',
              borderRadius: 8, cursor: ready ? 'pointer' : 'default',
              color: 'var(--accent)', fontSize: 13, fontWeight: 600,
              transition: 'opacity 150ms',
              opacity: ready ? 1 : 0.5,
            }}
            onMouseEnter={e => { if (ready) e.currentTarget.style.opacity = '0.8' }}
            onMouseLeave={e => { if (ready) e.currentTarget.style.opacity = '1' }}
          >
            <Wallet size={15} strokeWidth={2} />
            Connect
            <ChevronRight size={13} strokeWidth={2} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />
          </button>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <nav
        className="app-nav-desktop"
        style={{
          width: 240, flexShrink: 0,
          height: '100vh', position: 'sticky', top: 0,
          display: 'flex', flexDirection: 'column',
          background: 'var(--surface)', borderRight: '1px solid var(--border)',
          overflowY: 'auto',
        }}
      >
        {navContent}
      </nav>

      {/* ── Mobile top bar ── */}
      <div
        className="app-nav-mobile-bar"
        style={{
          display: 'none',
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          height: 52,
          background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        <Link href="/explore" style={{ textDecoration: 'none', color: 'var(--text-1)' }}>
          <LogoWordmark size={13} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => window.dispatchEvent(new Event('roobird:search'))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: 8 }}
            aria-label="Search"
          >
            <Search size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: 8 }}
            aria-label="Menu"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)',
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <nav
        className="app-nav-mobile-drawer"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 201,
          width: 280, display: 'flex', flexDirection: 'column',
          background: 'var(--surface)', borderRight: '1px solid var(--border)',
          overflowY: 'auto',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 250ms cubic-bezier(0.2,0,0,1)',
        }}
      >
        {navContent}
      </nav>

      {/* ── Mobile bottom nav ── */}
      <div
        className="app-nav-bottom"
        style={{
          display: 'none',
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          height: 60,
          background: 'var(--surface)', borderTop: '1px solid var(--border)',
          alignItems: 'center', justifyContent: 'space-around',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '6px 12px',
                textDecoration: 'none',
                color: active ? 'var(--accent)' : 'var(--text-3)',
                transition: 'color 120ms',
              }}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => window.dispatchEvent(new Event('roobird:compose'))}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '6px 12px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-3)',
          }}
        >
          <PenLine size={20} strokeWidth={1.5} />
          <span style={{ fontSize: 10 }}>Write</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .app-nav-desktop { display: none !important; }
          .app-nav-mobile-bar { display: flex !important; }
          .app-nav-bottom { display: flex !important; }
          .nav-close-btn { display: block !important; }
        }
      `}</style>
    </>
  )
}
