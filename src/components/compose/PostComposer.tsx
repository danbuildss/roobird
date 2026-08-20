'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, Search, Plus, Trash2, Eye, EyeOff,
  TrendingUp, TrendingDown, Minus, BookOpen, HelpCircle,
  ChevronDown, Check,
} from 'lucide-react'

// ── Assets autocomplete data ──────────────────────────────────────────────────

const ASSETS = [
  { symbol:'NVDA',  name:'NVIDIA Corporation'         },
  { symbol:'TSLA',  name:'Tesla, Inc.'                },
  { symbol:'AAPL',  name:'Apple Inc.'                 },
  { symbol:'MSFT',  name:'Microsoft Corporation'      },
  { symbol:'AMZN',  name:'Amazon.com, Inc.'           },
  { symbol:'META',  name:'Meta Platforms, Inc.'       },
  { symbol:'GOOGL', name:'Alphabet Inc.'              },
  { symbol:'AMD',   name:'Advanced Micro Devices'     },
  { symbol:'PLTR',  name:'Palantir Technologies'      },
  { symbol:'COIN',  name:'Coinbase Global, Inc.'      },
  { symbol:'NFLX',  name:'Netflix, Inc.'              },
  { symbol:'CRM',   name:'Salesforce, Inc.'           },
]

// ── Stance config ─────────────────────────────────────────────────────────────

const STANCES = [
  { key:'BULLISH',  label:'Bullish',  Icon:TrendingUp,   color:'#4ade80', bg:'rgba(74,222,128,0.12)'   },
  { key:'BEARISH',  label:'Bearish',  Icon:TrendingDown, color:'#f87171', bg:'rgba(248,113,113,0.12)'  },
  { key:'NEUTRAL',  label:'Neutral',  Icon:Minus,        color:'#94918d', bg:'rgba(148,145,141,0.12)'  },
  { key:'RESEARCH', label:'Research', Icon:BookOpen,     color:'#60a5fa', bg:'rgba(96,165,250,0.12)'   },
  { key:'QUESTION', label:'Question', Icon:HelpCircle,   color:'#f59e0b', bg:'rgba(245,158,11,0.12)'   },
]

// ── Asset dropdown ────────────────────────────────────────────────────────────

function AssetPicker({ value, onChange }: { value:string; onChange:(s:string)=>void }) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.length > 0
    ? ASSETS.filter(a =>
        a.symbol.toLowerCase().includes(query.toLowerCase()) ||
        a.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : ASSETS.slice(0, 6)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function select(symbol: string) {
    setQuery(symbol)
    onChange(symbol)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <div style={{
        display:'flex', alignItems:'center', gap:8,
        background:'var(--surface-raised)', border:'1px solid var(--border)',
        borderRadius:'var(--radius-input)', padding:'10px 12px',
        cursor:'text',
      }}
        onClick={() => { setOpen(true) }}
      >
        <Search size={13} strokeWidth={1.5} style={{ color:'var(--text-3)', flexShrink:0 }}/>
        <input
          type="text"
          placeholder="Search asset symbol…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          style={{
            flex:1, background:'none', border:'none', outline:'none',
            fontSize:13, color:'var(--text-1)', fontFamily:'var(--font-ui)',
          }}
        />
        {query && (
          <button onClick={e => { e.stopPropagation(); setQuery(''); onChange(''); }}
            style={{ background:'none', border:'none', cursor:'pointer', padding:2, color:'var(--text-3)' }}>
            <X size={12} strokeWidth={1.5}/>
          </button>
        )}
        <ChevronDown size={13} strokeWidth={1.5} style={{ color:'var(--text-3)', flexShrink:0 }}/>
      </div>
      {open && filtered.length > 0 && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:100,
          background:'var(--surface-raised)', border:'1px solid var(--border)',
          borderRadius:'var(--radius-input)', overflow:'hidden',
          boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {filtered.map(a => (
            <div key={a.symbol} onClick={() => select(a.symbol)} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'9px 12px', cursor:'pointer', transition:'background 80ms',
            }}
              onMouseEnter={e => (e.currentTarget.style.background='var(--surface)')}
              onMouseLeave={e => (e.currentTarget.style.background='transparent')}
            >
              <span style={{ fontSize:12, fontWeight:700, color:'var(--text-1)', fontFamily:'var(--font-mono)', minWidth:44 }}>{a.symbol}</span>
              <span style={{ fontSize:12, color:'var(--text-3)', flex:1 }}>{a.name}</span>
              {query.toUpperCase()===a.symbol && <Check size={11} strokeWidth={2} style={{ color:'var(--accent)' }}/>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Preview ───────────────────────────────────────────────────────────────────

function Preview({ stance, symbol, title, body, citations }: {
  stance:string; symbol:string; title:string; body:string; citations:string[]
}) {
  const s = STANCES.find(s => s.key===stance)

  return (
    <div style={{
      background:'var(--surface)', border:'1px solid var(--border)',
      borderRadius:'var(--radius-card)', padding:'18px 20px',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
        {symbol && (
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.04em', color:'var(--text-1)', background:'var(--surface-raised)', border:'1px solid var(--border)', padding:'2px 7px', borderRadius:'var(--radius-badge)' }}>
            {symbol}
          </span>
        )}
        {s && (
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em', color:s.color, background:s.bg, padding:'2px 7px', borderRadius:'var(--radius-badge)' }}>
            {s.key}
          </span>
        )}
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em', color:'var(--text-3)', background:'var(--surface-raised)', border:'1px solid var(--border)', padding:'2px 7px', borderRadius:'var(--radius-badge)' }}>
          HUMAN
        </span>
      </div>
      <p style={{ fontSize:14, fontWeight:600, color:'var(--text-1)', lineHeight:1.5, marginBottom:body?10:0 }}>
        {title || <span style={{ color:'var(--text-3)' }}>Your thesis headline…</span>}
      </p>
      {body && (
        <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.65, marginBottom:citations.filter(Boolean).length?10:0 }}>
          {body}
        </p>
      )}
      {citations.filter(Boolean).length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {citations.filter(Boolean).map((c,i) => (
            <a key={i} href={c} target="_blank" rel="noopener"
              style={{ fontSize:11, color:'#60a5fa', textDecoration:'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {c}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main composer ─────────────────────────────────────────────────────────────

export function PostComposer() {
  const [open, setOpen]         = useState(false)
  const [stance, setStance]     = useState<string>('')
  const [symbol, setSymbol]     = useState<string>('')
  const [title, setTitle]       = useState<string>('')
  const [body, setBody]         = useState<string>('')
  const [citations, setCitations] = useState<string[]>([''])
  const [preview, setPreview]   = useState(false)
  const titleRef = useRef<HTMLTextAreaElement>(null)

  const reset = useCallback(() => {
    setStance(''); setSymbol(''); setTitle(''); setBody('')
    setCitations(['']); setPreview(false)
  }, [])

  const openComposer = useCallback((e?: Event) => {
    const detail = (e as CustomEvent)?.detail
    if (detail?.symbol) setSymbol(detail.symbol)
    if (detail?.stance)  setStance(detail.stance)
    setOpen(true)
  }, [])

  const closeComposer = useCallback(() => {
    setOpen(false)
    setTimeout(reset, 200)
  }, [reset])

  // Global shortcut + custom event
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey||e.ctrlKey) && e.key==='n') { e.preventDefault(); setOpen(true) }
      if (e.key==='Escape') closeComposer()
    }
    function onCustom(e: Event) { openComposer(e) }

    window.addEventListener('keydown', onKey)
    window.addEventListener('roobird:compose', onCustom)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('roobird:compose', onCustom)
    }
  }, [openComposer, closeComposer])

  // Focus title when opened
  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 60)
  }, [open])

  const canPublish = !!stance && !!symbol && title.trim().length >= 10

  const titleLen  = title.length
  const TITLE_MAX = 280

  function addCitation() { setCitations(c => [...c,'']) }
  function updateCitation(i:number, v:string) { setCitations(c => c.map((x,j) => j===i?v:x)) }
  function removeCitation(i:number) { setCitations(c => c.filter((_,j) => j!==i)) }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div onClick={closeComposer} style={{
        position:'fixed', inset:0, zIndex:9998,
        background:'rgba(17,14,8,0.75)',
        backdropFilter:'blur(5px)',
        WebkitBackdropFilter:'blur(5px)',
      }}/>

      {/* Modal */}
      <div
        role="dialog"
        aria-label="Compose post"
        aria-modal="true"
        style={{
          position:'fixed',
          top:'8vh',
          left:'50%',
          transform:'translateX(-50%)',
          zIndex:9999,
          width:'min(680px, calc(100vw - 32px))',
          maxHeight:'84vh',
          overflowY:'auto',
          background:'var(--surface)',
          border:'1px solid var(--border)',
          borderRadius:16,
          boxShadow:'0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.4)',
          display:'flex',
          flexDirection:'column',
        }}
      >
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'16px 20px',
          borderBottom:'1px solid var(--border)',
          flexShrink:0,
        }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-1)', letterSpacing:'-0.01em' }}>New post</h2>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={() => setPreview(p => !p)}
              style={{
                display:'inline-flex', alignItems:'center', gap:5,
                padding:'5px 11px', borderRadius:'var(--radius-pill)',
                border:'1px solid var(--border)', background:'transparent',
                color: preview ? 'var(--text-1)' : 'var(--text-3)',
                fontSize:12, fontWeight:500, cursor:'pointer',
                transition:'all 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--text-3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
            >
              {preview ? <EyeOff size={12} strokeWidth={1.5}/> : <Eye size={12} strokeWidth={1.5}/>}
              {preview ? 'Edit' : 'Preview'}
            </button>
            <button onClick={closeComposer} aria-label="Close"
              style={{ background:'none', border:'none', cursor:'pointer', padding:4, borderRadius:6, color:'var(--text-3)', display:'flex', alignItems:'center', transition:'color 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.color='var(--text-1)')}
              onMouseLeave={e => (e.currentTarget.style.color='var(--text-3)')}
            >
              <X size={16} strokeWidth={1.5}/>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:16, flex:1 }}>

          {preview ? (
            <Preview stance={stance} symbol={symbol} title={title} body={body} citations={citations}/>
          ) : (
            <>
              {/* Stance */}
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', display:'block', marginBottom:8 }}>
                  Stance
                </label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {STANCES.map(s => {
                    const active = stance===s.key
                    return (
                      <button key={s.key} onClick={() => setStance(k => k===s.key?'':s.key)}
                        style={{
                          display:'inline-flex', alignItems:'center', gap:6,
                          padding:'7px 14px', borderRadius:'var(--radius-pill)',
                          border:`1px solid ${active ? s.color+'60' : 'var(--border)'}`,
                          background: active ? s.bg : 'transparent',
                          color: active ? s.color : 'var(--text-3)',
                          fontSize:12, fontWeight: active ? 700 : 500,
                          cursor:'pointer', transition:'all 150ms',
                        }}
                        onMouseEnter={e => { if(!active){ e.currentTarget.style.borderColor=s.color+'40'; e.currentTarget.style.color=s.color }}}
                        onMouseLeave={e => { if(!active){ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-3)' }}}
                      >
                        <s.Icon size={12} strokeWidth={active?2:1.5}/>
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Asset */}
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', display:'block', marginBottom:8 }}>
                  Asset
                </label>
                <AssetPicker value={symbol} onChange={setSymbol}/>
              </div>

              {/* Title */}
              <div>
                <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                    Headline
                  </label>
                  <span style={{ fontSize:10, fontVariantNumeric:'tabular-nums', color:titleLen>TITLE_MAX-20?'var(--down)':'var(--text-3)' }}>
                    {titleLen}/{TITLE_MAX}
                  </span>
                </div>
                <textarea
                  ref={titleRef}
                  value={title}
                  onChange={e => { if(e.target.value.length<=TITLE_MAX) setTitle(e.target.value) }}
                  placeholder="Your thesis in one clear sentence…"
                  rows={2}
                  style={{
                    width:'100%', boxSizing:'border-box',
                    background:'var(--surface-raised)', border:'1px solid var(--border)',
                    borderRadius:'var(--radius-input)', padding:'11px 12px',
                    fontSize:14, fontWeight:500, color:'var(--text-1)',
                    fontFamily:'var(--font-ui)', lineHeight:1.5,
                    outline:'none', resize:'none',
                    transition:'border-color 150ms',
                  }}
                  onFocus={e => (e.target.style.borderColor='rgba(204,255,0,0.4)')}
                  onBlur={e => (e.target.style.borderColor='var(--border)')}
                />
              </div>

              {/* Body */}
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', display:'block', marginBottom:8 }}>
                  Body <span style={{ fontWeight:400, textTransform:'none', fontSize:10 }}>(optional)</span>
                </label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Full analysis, data points, supporting context…"
                  rows={4}
                  style={{
                    width:'100%', boxSizing:'border-box',
                    background:'var(--surface-raised)', border:'1px solid var(--border)',
                    borderRadius:'var(--radius-input)', padding:'11px 12px',
                    fontSize:13, color:'var(--text-2)',
                    fontFamily:'var(--font-ui)', lineHeight:1.65,
                    outline:'none', resize:'vertical', minHeight:90,
                    transition:'border-color 150ms',
                  }}
                  onFocus={e => (e.target.style.borderColor='rgba(204,255,0,0.4)')}
                  onBlur={e => (e.target.style.borderColor='var(--border)')}
                />
              </div>

              {/* Citations */}
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase', display:'block', marginBottom:8 }}>
                  Citations <span style={{ fontWeight:400, textTransform:'none', fontSize:10 }}>(optional)</span>
                </label>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {citations.map((c, i) => (
                    <div key={i} style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <input
                        type="url"
                        value={c}
                        onChange={e => updateCitation(i, e.target.value)}
                        placeholder="https://ir.example.com/report-q2"
                        style={{
                          flex:1, background:'var(--surface-raised)', border:'1px solid var(--border)',
                          borderRadius:'var(--radius-input)', padding:'8px 12px',
                          fontSize:12, color:'var(--text-2)', fontFamily:'var(--font-mono)',
                          outline:'none', transition:'border-color 150ms',
                        }}
                        onFocus={e => (e.target.style.borderColor='rgba(204,255,0,0.4)')}
                        onBlur={e => (e.target.style.borderColor='var(--border)')}
                      />
                      {citations.length > 1 && (
                        <button onClick={() => removeCitation(i)} aria-label="Remove citation"
                          style={{ background:'none', border:'none', cursor:'pointer', padding:'6px', borderRadius:6, color:'var(--text-3)', transition:'color 150ms', display:'flex', alignItems:'center', flexShrink:0 }}
                          onMouseEnter={e => (e.currentTarget.style.color='var(--down)')}
                          onMouseLeave={e => (e.currentTarget.style.color='var(--text-3)')}
                        >
                          <Trash2 size={13} strokeWidth={1.5}/>
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addCitation}
                    style={{
                      display:'inline-flex', alignItems:'center', gap:5, alignSelf:'flex-start',
                      background:'none', border:'1px dashed var(--border)',
                      borderRadius:'var(--radius-input)', padding:'6px 12px',
                      color:'var(--text-3)', fontSize:12, cursor:'pointer',
                      transition:'border-color 150ms, color 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='var(--text-3)'; e.currentTarget.style.color='var(--text-2)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-3)' }}
                  >
                    <Plus size={12} strokeWidth={2}/> Add source
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 20px',
          borderTop:'1px solid var(--border)',
          background:'var(--surface-raised)',
          flexShrink:0,
        }}>
          <div style={{ display:'flex', gap:8, fontSize:11, color:'var(--text-3)' }}>
            {!stance && <span style={{ color:'var(--text-3)' }}>Choose a stance</span>}
            {stance && !symbol && <span style={{ color:'var(--text-3)' }}>Choose an asset</span>}
            {stance && symbol && title.trim().length < 10 && <span style={{ color:'var(--text-3)' }}>Add a headline (min 10 chars)</span>}
            {canPublish && (
              <span style={{ color:'var(--up)', display:'flex', alignItems:'center', gap:4 }}>
                <Check size={11} strokeWidth={2}/> Ready to publish
              </span>
            )}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={closeComposer}
              style={{
                padding:'8px 16px', borderRadius:'var(--radius-pill)',
                border:'1px solid var(--border)', background:'transparent',
                color:'var(--text-2)', fontSize:13, fontWeight:500, cursor:'pointer',
                transition:'all 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--text-3)'; e.currentTarget.style.color='var(--text-1)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-2)' }}
            >
              Cancel
            </button>
            <button
              disabled={!canPublish}
              onClick={closeComposer}
              style={{
                padding:'8px 20px', borderRadius:'var(--radius-pill)',
                border:'none',
                background: canPublish ? 'var(--accent)' : 'var(--surface-raised)',
                color: canPublish ? 'var(--accent-text)' : 'var(--text-3)',
                fontSize:13, fontWeight:700, cursor: canPublish ? 'pointer' : 'not-allowed',
                transition:'opacity 120ms, background 150ms, color 150ms',
              }}
              onMouseDown={e => { if(canPublish) e.currentTarget.style.transform='scale(0.96)' }}
              onMouseUp={e => (e.currentTarget.style.transform='scale(1)')}
              onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
