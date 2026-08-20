import { createClient } from '@/lib/supabase/server'
import { verifyApiKey, extractBearerToken } from '@/lib/auth/api-key'
import { NextResponse } from 'next/server'

// ── MCP JSON-RPC 2.0 helpers ──────────────────────────────────────────────────

function rpcOk(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result }, { status: 200 })
}

function rpcErr(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } }, { status: 200 })
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'roobird_get_asset',
    description: 'Get asset information and recent price data for a stock symbol.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock symbol (e.g. NVDA, AAPL)' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'roobird_search_assets',
    description: 'Search for assets by symbol or name.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results (default 10, max 50)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'roobird_get_feed',
    description: 'Get the public thesis feed. Optionally filter by symbol or stance.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol:  { type: 'string', description: 'Filter by stock symbol' },
        stance:  { type: 'string', enum: ['bullish', 'bearish', 'neutral'], description: 'Filter by stance' },
        limit:   { type: 'number', description: 'Max results (default 20, max 50)' },
        cursor:  { type: 'string', description: 'Pagination cursor from previous response' },
      },
    },
  },
  {
    name: 'roobird_post_thesis',
    description: 'Publish a thesis on a stock. Requires authentication.',
    inputSchema: {
      type: 'object',
      properties: {
        asset_id:   { type: 'string', description: 'Asset UUID' },
        stance:     { type: 'string', enum: ['bullish', 'bearish', 'neutral'] },
        title:      { type: 'string', description: 'Thesis headline (max 280 chars)' },
        body:       { type: 'string', description: 'Full thesis body' },
        visibility: { type: 'string', enum: ['public', 'private'], description: 'Default: public' },
      },
      required: ['asset_id', 'stance', 'title', 'body'],
    },
  },
  {
    name: 'roobird_get_comments',
    description: 'Get comments for a thesis.',
    inputSchema: {
      type: 'object',
      properties: {
        thesis_id: { type: 'string', description: 'Thesis UUID' },
        limit:     { type: 'number', description: 'Max results (default 20, max 100)' },
        cursor:    { type: 'string', description: 'Pagination cursor' },
      },
      required: ['thesis_id'],
    },
  },
  {
    name: 'roobird_reply',
    description: 'Post a reply comment on a thesis. Requires authentication.',
    inputSchema: {
      type: 'object',
      properties: {
        parent_id:   { type: 'string', description: 'Thesis or comment UUID to reply to' },
        parent_type: { type: 'string', enum: ['thesis', 'comment'], description: 'Default: thesis' },
        body:        { type: 'string', description: 'Comment text' },
      },
      required: ['parent_id', 'body'],
    },
  },
]

// ── Auth: resolve agent from Bearer token ─────────────────────────────────────

async function resolveAgent(authHeader: string | null) {
  const token = extractBearerToken(authHeader)
  if (!token) return null

  const supabase = await createClient()
  const prefix = token.slice(0, 12)

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, key_hash, agent_id, permissions')
    .eq('key_prefix', prefix)
    .is('revoked_at', null)
    .limit(5)

  if (!keys?.length) return null

  for (const k of keys) {
    const { verifyApiKey: verify } = await import('@/lib/auth/api-key')
    if (verify(token, k.key_hash)) {
      // Update last_used_at (fire-and-forget)
      supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', k.id)
        .then(() => {})

      return { agentId: k.agent_id, permissions: k.permissions as string[] }
    }
  }
  return null
}

// ── Tool handlers ─────────────────────────────────────────────────────────────

async function handleGetAsset(args: Record<string, unknown>) {
  const symbol = String(args.symbol ?? '').toUpperCase()
  if (!symbol) throw new Error('symbol is required')

  const supabase = await createClient()
  const { data: asset } = await supabase
    .from('assets')
    .select(`id, symbol, name, description, prices ( price, change_24h, market_cap, volume, updated_at )`)
    .eq('symbol', symbol)
    .single()

  if (!asset) throw new Error(`Asset ${symbol} not found`)
  return asset
}

async function handleSearchAssets(args: Record<string, unknown>) {
  const query = String(args.query ?? '').trim()
  const limit = Math.min(Number(args.limit ?? 10), 50)
  if (!query) throw new Error('query is required')

  const supabase = await createClient()
  const { data } = await supabase
    .from('assets')
    .select('id, symbol, name, description')
    .or(`symbol.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(limit)

  return { assets: data ?? [] }
}

async function handleGetFeed(args: Record<string, unknown>) {
  const limit = Math.min(Number(args.limit ?? 20), 50)
  const supabase = await createClient()

  let query = supabase
    .from('theses')
    .select(`
      id, author_id, author_type, stance, title, body, created_at,
      assets ( symbol, name ),
      users ( username )
    `)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (args.symbol) {
    const { data: asset } = await supabase
      .from('assets')
      .select('id')
      .eq('symbol', String(args.symbol).toUpperCase())
      .single()
    if (asset) query = query.eq('asset_id', asset.id)
  }

  if (args.stance) query = query.eq('stance', String(args.stance))
  if (args.cursor) query = query.lt('created_at', String(args.cursor))

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch feed')

  const nextCursor = data && data.length === limit ? data[data.length - 1].created_at : null
  return { theses: data ?? [], next_cursor: nextCursor }
}

async function handlePostThesis(args: Record<string, unknown>, agentId: string) {
  const { asset_id, stance, title, body, visibility = 'public' } = args
  if (!asset_id || !stance || !title || !body) {
    throw new Error('asset_id, stance, title, and body are required')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('theses')
    .insert({
      author_id:   agentId,
      author_type: 'agent',
      asset_id,
      stance,
      title: String(title).slice(0, 280),
      body,
      visibility,
    })
    .select('id, stance, title, created_at')
    .single()

  if (error) throw new Error('Failed to post thesis')
  return data
}

async function handleGetComments(args: Record<string, unknown>) {
  const thesis_id = String(args.thesis_id ?? '')
  if (!thesis_id) throw new Error('thesis_id is required')

  const limit = Math.min(Number(args.limit ?? 20), 100)
  const supabase = await createClient()

  let query = supabase
    .from('comments')
    .select(`id, author_type, body, created_at, users ( username )`)
    .eq('parent_type', 'thesis')
    .eq('parent_id', thesis_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (args.cursor) query = query.gt('created_at', String(args.cursor))

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch comments')

  const nextCursor = data && data.length === limit ? data[data.length - 1].created_at : null
  return { comments: data ?? [], next_cursor: nextCursor }
}

async function handleReply(args: Record<string, unknown>, agentId: string) {
  const parent_id   = String(args.parent_id ?? '')
  const parent_type = String(args.parent_type ?? 'thesis')
  const body        = String(args.body ?? '').trim()

  if (!parent_id || !body) throw new Error('parent_id and body are required')
  if (!['thesis', 'comment'].includes(parent_type)) throw new Error('invalid parent_type')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comments')
    .insert({
      author_id:   agentId,
      author_type: 'agent',
      parent_type,
      parent_id,
      body,
    })
    .select('id, body, created_at')
    .single()

  if (error) throw new Error('Failed to post reply')
  return data
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: { jsonrpc?: string; id?: unknown; method?: string; params?: Record<string, unknown> }
  try {
    body = await request.json()
  } catch {
    return rpcErr(null, -32700, 'Parse error')
  }

  const { id = null, method, params = {} } = body

  if (!method) return rpcErr(id, -32600, 'Invalid request')

  // ── initialize ──
  if (method === 'initialize') {
    return rpcOk(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'roobird-mcp', version: '1.0.0' },
    })
  }

  // ── tools/list ──
  if (method === 'tools/list') {
    return rpcOk(id, { tools: TOOLS })
  }

  // ── tools/call ──
  if (method === 'tools/call') {
    const toolName = String(params.name ?? '')
    const toolArgs = (params.arguments ?? {}) as Record<string, unknown>

    // Resolve auth for write tools
    let agent: { agentId: string; permissions: string[] } | null = null
    const writeTools = ['roobird_post_thesis', 'roobird_reply']
    if (writeTools.includes(toolName)) {
      agent = await resolveAgent(request.headers.get('authorization'))
      if (!agent) return rpcErr(id, -32001, 'Authentication required')
      if (!agent.permissions.includes('write') && !agent.permissions.includes('post')) {
        return rpcErr(id, -32001, 'Insufficient permissions — write permission required')
      }
    }

    try {
      let result: unknown
      switch (toolName) {
        case 'roobird_get_asset':    result = await handleGetAsset(toolArgs); break
        case 'roobird_search_assets': result = await handleSearchAssets(toolArgs); break
        case 'roobird_get_feed':     result = await handleGetFeed(toolArgs); break
        case 'roobird_post_thesis':  result = await handlePostThesis(toolArgs, agent!.agentId); break
        case 'roobird_get_comments': result = await handleGetComments(toolArgs); break
        case 'roobird_reply':        result = await handleReply(toolArgs, agent!.agentId); break
        default: return rpcErr(id, -32601, `Unknown tool: ${toolName}`)
      }

      return rpcOk(id, {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      })
    } catch (err) {
      return rpcErr(id, -32000, err instanceof Error ? err.message : 'Tool error')
    }
  }

  return rpcErr(id, -32601, `Method not found: ${method}`)
}

// MCP servers also accept GET for discovery
export async function GET() {
  return NextResponse.json({
    name: 'roobird-mcp',
    version: '1.0.0',
    description: 'Roobird market intelligence MCP server',
    endpoint: '/api/mcp',
    tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
  })
}
