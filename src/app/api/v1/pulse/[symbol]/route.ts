import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'
import { after } from 'next/server'

const CACHE_TTL_MS = 3 * 60 * 1000 // 3 minutes

interface KeyPost {
  text: string
  author_handle: string
  url: string
  posted_at: string
  likes: number | null
}

interface PulseRow {
  symbol: string
  sentiment: 'Bullish' | 'Neutral' | 'Bearish'
  sentiment_score: number
  summary: string
  key_posts: KeyPost[]
  themes: string[]
  updated_at: string
}

async function fetchFromGrok(symbol: string): Promise<Omit<PulseRow, 'symbol' | 'updated_at'>> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) throw new Error('XAI_API_KEY not configured')

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-3',
      tools: [{ type: 'web_search', web_search: { mode: 'on' } }],
      messages: [
        {
          role: 'user',
          content: `Search X/Twitter for recent posts about $${symbol} stock from the last 24 hours. Analyze the sentiment and return ONLY valid JSON with this exact structure, no other text:
{
  "sentiment": "Bullish" | "Neutral" | "Bearish",
  "sentiment_score": number between -1.0 (very bearish) and 1.0 (very bullish),
  "summary": "2-3 sentence summary of what people are saying about $${symbol} right now",
  "key_posts": [
    { "text": "post text", "author_handle": "@handle", "url": "https://x.com/handle/status/ID", "posted_at": "ISO timestamp", "likes": number or null }
  ],
  "themes": ["theme1", "theme2"]
}
Return at most 3 key_posts. Return no other text outside the JSON.`,
        },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) throw new Error(`Grok API error: ${res.status}`)

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? ''

  // Extract JSON — model may wrap in markdown code fences
  const match = content.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in Grok response')

  const parsed = JSON.parse(match[0])

  return {
    sentiment: parsed.sentiment,
    sentiment_score: Number(parsed.sentiment_score),
    summary: String(parsed.summary),
    key_posts: Array.isArray(parsed.key_posts) ? parsed.key_posts.slice(0, 3) : [],
    themes: Array.isArray(parsed.themes) ? parsed.themes.slice(0, 5) : [],
  }
}

async function refreshPulse(symbol: string) {
  try {
    const grok = await fetchFromGrok(symbol)
    const supabase = await createServiceClient()
    await supabase.from('market_pulse').upsert(
      { symbol, ...grok, updated_at: new Date().toISOString() },
      { onConflict: 'symbol' }
    )
  } catch {
    // Non-fatal — stale data is fine
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()

  const supabase = await createClient()
  const { data: cached, error } = await supabase
    .from('market_pulse')
    .select('symbol, sentiment, sentiment_score, summary, key_posts, themes, updated_at')
    .eq('symbol', sym)
    .single()

  if (error && error.code !== 'PGRST116') return Errors.internal()

  // Symbol not in whitelist (no row seeded) — return null gracefully
  if (!cached) return ok(null)

  const isStale = Date.now() - new Date(cached.updated_at).getTime() > CACHE_TTL_MS

  if (isStale) {
    // Serve stale immediately, refresh in background
    after(() => refreshPulse(sym))
  }

  return ok(cached as PulseRow)
}
