'use client'

import { useState, use, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePrivy } from '@privy-io/react-auth'
import {
  ArrowLeft, MessageSquare, ChevronUp, ChevronDown,
  Calendar, ExternalLink, UserPlus, UserCheck,
  TrendingUp, TrendingDown, Shield, Edit2,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatarColors(username: string): [string, string] {
  const palettes: [string, string][] = [
    ['#ccff00', '#00ff88'],
    ['#60a5fa', '#a78bfa'],
    ['#f59e0b', '#f87171'],
    ['#4ade80', '#22d3ee'],
    ['#f472b6', '#fb923c'],
    ['#818cf8', '#34d399'],
  ]
  const idx = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palettes.length
  return palettes[idx]
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function joinedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// ── Types ─────────────────────────────────────────────────────────────────────

const STANCE_COLOR: Record<string, string> = {
  BULLISH:  '#4ade80',
  BEARISH:  '#f87171',
  NEUTRAL:  '#94918d',
  RESEARCH: '#60a5fa',
  QUESTION: '#f59e0b',
}

interface ProfileUser {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  created_at: string
}

interface Thesis {
  id: string
  stance: string
  title: string
  created_at: string
  assets?: { symbol: string } | null
}

type PostRowData = {
  id: string
  stance: string
  symbol: string
  title: string
  time: string
  votes: number
  comments: number
}

type ProfileTab = 'posts' | 'theses' | 'research' | 'replies' | 'about'

// ── Post row ──────────────────────────────────────────────────────────────────

function PostRow({ post }: { post: PostRowData }) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const count = post.votes + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0)
  const sc = STANCE_COLOR[post.stance] ?? '#94918d'

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '14px 20px',
      borderBottom: '1px solid var(--border-subtle)',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 28, paddingTop: 2, flexShrink: 0 }}>
        <button onClick={() => setVote(v => v === 'up' ? null : 'up')} aria-label="Upvote"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, borderRadius: 4, color: vote === 'up' ? 'var(--up)' : 'var(--text-3)', transition: 'color 120ms' }}>
          <ChevronUp size={13} strokeWidth={vote === 'up' ? 2.5 : 1.5} />
        </button>
        <span style={{ fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: vote === 'up' ? 'var(--up)' : vote === 'down' ? 'var(--down)' : 'var(--text-2)' }}>{count}</span>
        <button onClick={() => setVote(v => v === 'down' ? null : 'down')} aria-label="Downvote"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, borderRadius: 4, color: vote === 'down' ? 'var(--down)' : 'var(--text-3)', transition: 'color 120ms' }}>
          <ChevronDown size={13} strokeWidth={vote === 'down' ? 2.5 : 1.5} />
        </button>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          {post.symbol !== '—' && (
            <Link href={`/market/${post.symbol}`} style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-1)', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 'var(--radius-badge)' }}>
                {post.symbol}
              </span>
            </Link>
          )}
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: sc, background: `${sc}18`, padding: '1px 6px', borderRadius: 'var(--radius-badge)' }}>
            {post.stance}
          </span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.45, marginBottom: 7 }}>{post.title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
          <span>{post.time}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <MessageSquare size={11} strokeWidth={1.5} />{post.comments}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Activity sparkline (30-day placeholder) ───────────────────────────────────

function ActivityChart({ postCount }: { postCount: number }) {
  const bars = Array.from({ length: 30 }, (_, i) => {
    if (i === 29) return Math.min(postCount, 5)
    return Math.floor(Math.random() * 4)
  })
  const max = Math.max(...bars, 1)
  const W = 180, H = 36, gap = 2
  const bw = (W - gap * (bars.length - 1)) / bars.length

  return (
    <svg width={W} height={H} aria-hidden="true">
      {bars.map((v, i) => {
        const h = v === 0 ? 2 : Math.max(3, (v / max) * (H - 4))
        const x = i * (bw + gap)
        return (
          <rect key={i} x={x} y={H - h} width={bw} height={h} rx={1.5}
            fill={v === 0 ? 'var(--border)' : 'var(--accent)'}
            opacity={v === 0 ? 1 : 0.55 + (v / max) * 0.45}
          />
        )
      })}
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const [tab, setTab] = useState<ProfileTab>('posts')
  const [following, setFollowing] = useState(false)

  const [profileUser, setProfileUser]   = useState<ProfileUser | null>(null)
  const [theses, setTheses]             = useState<Thesis[]>([])
  const [userLoading, setUserLoading]   = useState(true)
  const [thesesLoading, setThesesLoading] = useState(true)

  const { user: privyUser, authenticated } = usePrivy()

  // Fetch profile user data
  useEffect(() => {
    setUserLoading(true)
    fetch(`/api/v1/users/${username}`)
      .then(r => r.json())
      .then(data => setProfileUser(data.data ?? null))
      .catch(() => setProfileUser(null))
      .finally(() => setUserLoading(false))
  }, [username])

  // Fetch theses once we have the user's Supabase ID
  useEffect(() => {
    if (!profileUser?.id) return
    setThesesLoading(true)
    fetch(`/api/v1/theses?author_id=${profileUser.id}&limit=50`)
      .then(r => r.json())
      .then(data => setTheses(data.data?.theses ?? []))
      .catch(() => setTheses([]))
      .finally(() => setThesesLoading(false))
  }, [profileUser?.id])

  // Determine if this is the logged-in user's own profile
  const isOwnProfile = authenticated && (
    (privyUser?.twitter?.username?.toLowerCase() === username.toLowerCase()) ||
    (privyUser?.email?.address?.split('@')[0]?.toLowerCase() === username.toLowerCase())
  )

  // Avatar: Privy Twitter PFP for own profile, else Supabase avatar_url, else gradient
  const pfpUrl = isOwnProfile && privyUser?.twitter?.profilePictureUrl
    ? privyUser.twitter.profilePictureUrl
    : profileUser?.avatar_url

  const [c1, c2] = avatarColors(username)
  const initials = username.slice(0, 2).toUpperCase()

  // Convert theses to PostRow shape
  const toPost = useCallback((t: Thesis): PostRowData => ({
    id: t.id,
    stance: t.stance.toUpperCase(),
    symbol: t.assets?.symbol ?? '—',
    title: t.title,
    time: timeAgo(t.created_at),
    votes: 0,
    comments: 0,
  }), [])

  const allPosts     = theses.map(toPost)
  const thesisPosts  = theses.filter(t => ['bullish', 'bearish', 'neutral'].includes(t.stance)).map(toPost)
  const researchPosts = theses.filter(t => t.stance === 'research' || t.stance === 'question').map(toPost)

  const TABS: { key: ProfileTab; label: string; count?: number }[] = [
    { key: 'posts',    label: 'Posts',    count: thesesLoading ? undefined : allPosts.length      },
    { key: 'theses',   label: 'Theses',   count: thesesLoading ? undefined : thesisPosts.length   },
    { key: 'research', label: 'Research', count: thesesLoading ? undefined : researchPosts.length },
    { key: 'replies',  label: 'Replies'   },
    { key: 'about',    label: 'About'     },
  ]

  const feedPosts =
    tab === 'posts'    ? allPosts      :
    tab === 'theses'   ? thesisPosts   :
    tab === 'research' ? researchPosts : []

  const displayLoading = userLoading
  const notFound = !userLoading && !profileUser

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px 64px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>

      {/* ── Left / main column ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Back */}
        <div style={{ padding: '20px 0 0' }}>
          <Link href="/explore" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--text-3)', textDecoration: 'none',
            transition: 'color 150ms',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            <ArrowLeft size={13} strokeWidth={1.5} />
            Back
          </Link>
        </div>

        {/* Not found */}
        {notFound && (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>User not found</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>@{username} doesn&apos;t exist on Roobird yet.</p>
          </div>
        )}

        {/* Profile header */}
        {!notFound && (
          <div style={{ padding: '24px 0 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>

              {/* Avatar */}
              {displayLoading ? (
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--surface-raised)', flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ) : pfpUrl ? (
                <img
                  src={pfpUrl}
                  alt={username}
                  style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }}
                />
              ) : (
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${c1}, ${c2})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#110e08', letterSpacing: '-0.02em' }}>{initials}</span>
                </div>
              )}

              <div style={{ flex: 1 }}>
                {displayLoading ? (
                  <>
                    <div style={{ height: 22, width: 140, background: 'var(--surface-raised)', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ height: 14, width: 80, background: 'var(--surface-raised)', borderRadius: 4, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ height: 13, width: '80%', background: 'var(--surface-raised)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-1)' }}>
                        {username}
                      </h1>
                      <span title="Verified human" style={{ color: '#60a5fa', display: 'flex', alignItems: 'center' }}>
                        <Shield size={14} strokeWidth={2} />
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>@{username}</p>
                    {profileUser?.bio && (
                      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 10, maxWidth: 480 }}>
                        {profileUser.bio}
                      </p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: 'var(--text-3)' }}>
                      {profileUser?.created_at && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={11} strokeWidth={1.5} />Joined {joinedDate(profileUser.created_at)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Own profile: Edit button. Others: Follow button */}
              {!displayLoading && (
                isOwnProfile ? (
                  <Link href="/settings/profile" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--text-2)', fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', flexShrink: 0, transition: 'all 150ms',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-3)'; e.currentTarget.style.color = 'var(--text-1)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
                  >
                    <Edit2 size={13} strokeWidth={2} />
                    Edit profile
                  </Link>
                ) : (
                  <button
                    onClick={() => setFollowing(f => !f)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 'var(--radius-pill)',
                      border: following ? '1px solid var(--border)' : '1px solid var(--accent)',
                      background: following ? 'transparent' : 'var(--accent)',
                      color: following ? 'var(--text-2)' : 'var(--accent-text)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 150ms', flexShrink: 0,
                    }}
                    onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
                    onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {following
                      ? <><UserCheck size={13} strokeWidth={2} />Following</>
                      : <><UserPlus size={13} strokeWidth={2} />Follow</>
                    }
                  </button>
                )
              )}
            </div>

            {/* Stats row */}
            {!displayLoading && (
              <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-3)' }}>
                <span>
                  <span style={{ color: 'var(--text-1)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {thesesLoading ? '—' : allPosts.length}
                  </span>{' '}posts
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        {!notFound && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {TABS.map(({ key, label, count }) => (
              <button key={key} onClick={() => setTab(key)} style={{
                padding: '12px 14px 11px',
                border: 'none', borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
                background: 'transparent',
                color: tab === key ? 'var(--text-1)' : 'var(--text-3)',
                fontSize: 13, fontWeight: tab === key ? 600 : 400,
                cursor: 'pointer', marginBottom: -1,
                transition: 'color 120ms, border-color 120ms',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {label}
                {count !== undefined && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                    color: tab === key ? 'var(--accent)' : 'var(--text-3)',
                    background: tab === key ? 'var(--accent-dim)' : 'transparent',
                    padding: '1px 5px', borderRadius: 'var(--radius-badge)',
                    transition: 'color 120ms, background 120ms',
                  }}>{count}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Post feed */}
        {!notFound && (tab === 'posts' || tab === 'theses' || tab === 'research') && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--radius-card) var(--radius-card)' }}>
            {thesesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 12 }}>
                  <div style={{ width: 28, flexShrink: 0 }}>
                    <div style={{ width: 20, height: 60, background: 'var(--surface-raised)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, width: '25%', background: 'var(--surface-raised)', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ height: 13, width: '90%', background: 'var(--surface-raised)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  </div>
                </div>
              ))
            ) : feedPosts.length > 0 ? (
              feedPosts.map(p => <PostRow key={p.id} post={p} />)
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                {isOwnProfile
                  ? `No ${tab} yet. Share your first market thesis!`
                  : `No ${tab} yet.`}
              </div>
            )}
          </div>
        )}

        {/* Replies tab — placeholder */}
        {!notFound && tab === 'replies' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--radius-card) var(--radius-card)' }}>
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No replies yet.
            </div>
          </div>
        )}

        {/* About */}
        {!notFound && tab === 'about' && (
          <div style={{ padding: '28px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {profileUser?.bio && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Bio</p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{profileUser.bio}</p>
              </div>
            )}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Details</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1, background: 'var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                {[
                  { label: 'Account type', value: 'Human' },
                  { label: 'Joined',       value: profileUser?.created_at ? joinedDate(profileUser.created_at) : '—' },
                  { label: 'Verified',     value: 'Yes' },
                  { label: 'Posts',        value: String(allPosts.length) },
                ].map(row => (
                  <div key={row.label} style={{ background: 'var(--surface)', padding: '12px 16px' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>{row.label}</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right sidebar ── */}
      <aside style={{
        width: 256, flexShrink: 0,
        position: 'sticky', top: 24,
        paddingTop: 52,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>

        {/* Activity */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '16px 18px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Activity — 30d</p>
          <ActivityChart postCount={allPosts.length} />
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
            <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{allPosts.length}</span> posts
          </p>
        </div>

        {/* Top stances */}
        {!thesesLoading && allPosts.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '14px 16px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Stance breakdown</p>
            {(['BULLISH', 'BEARISH', 'NEUTRAL', 'RESEARCH'] as const).map(s => {
              const count = allPosts.filter(p => p.stance === s).length
              if (count === 0) return null
              const color = STANCE_COLOR[s]
              return (
                <div key={s} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize' }}>{s.toLowerCase()}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface-raised)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / allPosts.length) * 100}%`, background: color, opacity: 0.7, borderRadius: 2 }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Watching — link to markets */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '14px 16px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Watchlist</p>
          <Link href="/explore" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={12} strokeWidth={1.5} />
            View on Explore
          </Link>
        </div>

        {/* External links */}
        {profileUser?.avatar_url && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '14px 16px' }}>
            <a href={`https://twitter.com/${username}`} target="_blank" rel="noopener"
              style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ExternalLink size={12} strokeWidth={1.5} />
              @{username} on X
            </a>
          </div>
        )}
      </aside>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          aside { display: none !important; }
        }
        @media (max-width: 640px) {
          .profile-main { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>
    </div>
  )
}
