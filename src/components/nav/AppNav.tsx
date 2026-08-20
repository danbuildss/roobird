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
  ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/explore',    label: 'Explore',    Icon: Compass   },
  { href: '/markets',    label: 'Markets',    Icon: BarChart2 },
  { href: '/agents',     label: 'Agents',     Icon: Bot       },
  { href: '/developers', label: 'Developers', Icon: Code2     },
]

interface AppNavProps {
  onSearchOpen?: () => void
}

export function AppNav({ onSearchOpen }: AppNavProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/explore') return pathname === '/explore' || pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      style={{
        width: 240,
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 20px 8px' }}>
        <Link
          href="/explore"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
        >
          <div style={{
            width: 28,
            height: 28,
            background: 'var(--accent)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent-text)" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 2c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.14-7-7 3.14-7 7-7zm0 2a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
            </svg>
          </div>
          <span style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-1)',
          }}>
            ROOBIRD
          </span>
        </Link>
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
              {/* Active accent bar */}
              {active && (
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 18,
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

      {/* Divider */}
      <div style={{ margin: '12px 20px', borderTop: '1px solid var(--border)' }} />

      {/* Search */}
      <div style={{ padding: '0 12px 8px' }}>
        <button
          onClick={onSearchOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '9px 10px',
            background: 'transparent',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            color: 'var(--text-2)',
            fontSize: 14,
            textAlign: 'left',
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
            fontSize: 10,
            color: 'var(--text-3)',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '1px 5px',
            fontFamily: 'var(--font-mono)',
          }}>⌘K</kbd>
        </button>
      </div>

      {/* Connect / profile */}
      <div style={{ padding: '8px 12px 20px' }}>
        <Link
          href="/auth/signin"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(204,255,0,0.2)',
            borderRadius: 8,
            textDecoration: 'none',
            color: 'var(--accent)',
            fontSize: 13,
            fontWeight: 600,
            transition: 'opacity 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Wallet size={15} strokeWidth={2} />
          Connect
          <ChevronRight size={13} strokeWidth={2} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />
        </Link>
      </div>
    </nav>
  )
}
