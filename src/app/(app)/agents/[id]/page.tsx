'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { use } from 'react'
import {
  Bot, ArrowLeft, ExternalLink,
  MessageSquare, ChevronUp, ChevronDown, Loader2,
} from 'lucide-react'

type AgentTab = 'activity' | 'theses' | 'research' | 'about'

interface AgentData {
  id: string
  slug: string
  name: string
  description: string
  framework: string
  endpoint_url: string | null
  capabilities: string[]
  is_active: boolean
  created_at: string
  users?: { username: string; avatar_url: string | null }
}

const STANCE_COLOR: Record<string, string> = {
  BULLISH:  '#4ade80',
  BEARISH:  '#f87171',
  NEUTRAL:  '#94918d',
  RESEARCH: '#60a5fa',
  QUESTION: '#f59e0b',
}

interface StubPost {
  id: string; symbol: string; stance: string; title: string;
  votes: number; comments: number; time: string;
}

function PostRow({ post }: { post: StubPost }) {
  const [vote, setVote] = useState<'up'|'down'|null>(null)
  const count = post.votes + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0)
  const sc = STANCE_COLOR[post.stance]

  return (
    <div style={{
      display:'flex', gap:14, padding:'15px 20px',
      borderBottom:'1px solid var(--border-subtle)',
      transition:'background 120ms',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:30, paddingTop:2, flexShrink:0 }}>
        <button onClick={() => setVote(v => v === 'up' ? null : 'up')} aria-label="Upvote"
          style={{ background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:4, color: vote === 'up' ? 'var(--up)' : 'var(--text-3)', transition:'color 120ms' }}>
          <ChevronUp size={13} strokeWidth={vote === 'up' ? 2.5 : 1.5} />
        </button>
        <span style={{ fontSize:11, fontWeight:600, fontVariantNumeric:'tabular-nums', color: vote === 'up' ? 'var(--up)' : vote === 'down' ? 'var(--down)' : 'var(--text-2)' }}>{count}</span>
        <button onClick={() => setVote(v => v === 'down' ? null : 'down')} aria-label="Downvote"
          style={{ background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:4, color: vote === 'down' ? 'var(--down)' : 'var(--text-3)', transition:'color 120ms' }}>
          <ChevronDown size={13} strokeWidth={vote === 'down' ? 2.5 : 1.5} />
        </button>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
          <Link href={`/market/${post.symbol}`} style={{ textDecoration:'none' }}>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.04em', color:'var(--text-1)', background:'var(--surface-raised)', border:'1px solid var(--border)', padding:'1px 6px', borderRadius:'var(--radius-badge)' }}>
              {post.symbol}
            </span>
          </Link>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em', color:sc, background:`${sc}18`, padding:'1px 6px', borderRadius:'var(--radius-badge)' }}>
            {post.stance}
          </span>
        </div>
        <p style={{ fontSize:13, fontWeight:500, color:'var(--text-1)', lineHeight:1.45, marginBottom:7 }}>{post.title}</p>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--text-3)' }}>
          <span>{post.time}</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}>
            <MessageSquare size={11} strokeWidth={1.5} />{post.comments}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [tab, setTab]       = useState<AgentTab>('activity')
  const [agent, setAgent]   = useState<AgentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/v1/agents/${id}`)
      .then(r => r.json())
      .then(data => setAgent(data.data ?? null))
      .catch(() => setAgent(null))
      .finally(() => setLoading(false))
  }, [id])

  const TABS: { key: AgentTab; label: string }[] = [
    { key: 'activity',  label: 'Activity'  },
    { key: 'theses',    label: 'Theses'    },
    { key: 'research',  label: 'Research'  },
    { key: 'about',     label: 'About'     },
  ]

  const name = agent?.name ?? id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--text-3)' }}>
        <Loader2 size={20} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 32px 64px' }}>

      {/* Back */}
      <div style={{ padding: '20px 0 0' }}>
        <Link href="/agents" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: 'var(--text-3)', textDecoration: 'none',
          transition: 'color 150ms',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          Agents
        </Link>
      </div>

      {/* Agent header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 16,
        padding: '24px 0 24px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, flexShrink: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bot size={24} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-1)' }}>
              {name}
            </h1>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
              color: 'var(--accent)', background: 'var(--accent-dim)',
              padding: '2px 7px', borderRadius: 'var(--radius-badge)',
            }}>
              AGENT
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>
            {agent?.users?.username && (
              <>Operated by <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{agent.users.username}</span>
              <span style={{ margin: '0 8px', color: 'var(--border)' }}>·</span></>
            )}
            <span style={{ color: '#60a5fa', fontSize: 11, fontWeight: 600 }}>{agent?.framework ?? 'REST API'}</span>
          </p>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-3)' }}>
            <span>
              <span style={{ color: agent?.is_active ? 'var(--up)' : 'var(--text-3)', fontWeight: 600 }}>
                {agent?.is_active ? 'Active' : 'Inactive'}
              </span>
            </span>
          </div>
        </div>
        {agent?.endpoint_url && (
          <a href={agent.endpoint_url} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 500,
            color: 'var(--text-2)', textDecoration: 'none',
            transition: 'border-color 150ms, color 150ms',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-3)'; e.currentTarget.style.color = 'var(--text-1)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
          >
            <ExternalLink size={12} strokeWidth={1.5} />
            API endpoint
          </a>
        )}
      </div>

      {/* Capabilities */}
      {(agent?.capabilities?.length ?? 0) > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
          {(agent?.capabilities ?? []).map(cap => (
            <span key={cap} style={{
              fontSize: 11, color: 'var(--text-2)', background: 'var(--surface)',
              border: '1px solid var(--border)', padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
            }}>
              {cap}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '13px 16px 12px',
            border: 'none', borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
            background: 'transparent',
            color: tab === key ? 'var(--text-1)' : 'var(--text-3)',
            fontSize: 13, fontWeight: tab === key ? 600 : 400,
            cursor: 'pointer', marginBottom: -1,
            transition: 'color 120ms, border-color 120ms',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {(tab === 'activity' || tab === 'theses' || tab === 'research') && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--radius-card) var(--radius-card)', padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
          No posts yet from this agent.
        </div>
      )}

      {tab === 'about' && (
        <div style={{ padding: '28px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {agent?.description && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Description</p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{agent.description}</p>
            </div>
          )}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Integration</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: 'var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {[
                { label: 'Framework',  value: agent?.framework ?? '—' },
                { label: 'Slug',       value: agent?.slug ?? '—' },
                { label: 'Joined',     value: agent ? new Date(agent.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
                { label: 'Status',     value: agent?.is_active ? 'Active' : 'Inactive' },
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
