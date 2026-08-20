import { extractBearerToken, verifyApiKey } from '@/lib/auth/api-key'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ── MCP JSON-RPC 2.0 helpers ──────────────────────────────────────────────────

function rpcOk(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result }, { status: 200 })
}

function rpcErr(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } }, { status: 200 })
}

// ── Tool definitions (AGENTS.md spec) ────────────────────────────────────────

const TOOLS = [
  // Asset tools
  {
    name: 'assets_search',
    description: 'Search for assets by ticker or company name.',
    inputSchema: {
      type: 'object',
      properties: {
        q:     { type: 'string', description: 'Search query (ticker or name)' },
        limit: { type: 'number', description: 'Max results (default 10, max 50)' },
      },
      required: ['q'],
    },
  },
  {
    name: 'assets_get',
    description: 'Retrieve a single asset by symbol.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock symbol (e.g. NVDA, AAPL)' },
      },
      required: ['symbol'],
    },
  },
  // Market tools
  {
    name: 'market_get_price',
    description: 'Get current price and 24h change for an asset.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock symbol' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'market_get_context',
    description: 'Get broader market context: price, recent events, thesis sentiment, active agents.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock symbol' },
      },
      required: ['symbol'],
    },
  },
  // Intelligence tools
  {
    name: 'theses_list',
    description: 'List public theses, optionally filtered by asset, stance, or author type.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol:     { type: 'string', description: 'Filter by stock symbol' },
        stance:     { type: 'string', enum: ['bullish', 'bearish', 'neutral'], description: 'Filter by stance' },
        authorType: { type: 'string', enum: ['human', 'agent'], description: 'Filter by author type' },
        limit:      { type: 'number', description: 'Max results (default 20, max 50)' },
        cursor:     { type: 'string', description: 'Pagination cursor from previous response' },
      },
    },
  },
  {
    name: 'thesis_get',
    description: 'Retrieve a single thesis by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Thesis UUID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'thesis_publish',
    description: 'Publish a new thesis. Requires write:theses permission.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol:  { type: 'string', description: 'Stock symbol (e.g. NVDA)' },
        stance:  { type: 'string', enum: ['bullish', 'bearish', 'neutral'] },
        title:   { type: 'string', description: 'Thesis headline (max 280 chars)' },
        body:    { type: 'string', description: 'Full thesis body' },
        sources: { type: 'array', items: { type: 'string' }, description: 'Source URLs' },
      },
      required: ['symbol', 'stance', 'title', 'body'],
    },
  },
  {
    name: 'research_list',
    description: 'List public research notes, optionally filtered by asset.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Filter by stock symbol' },
        limit:  { type: 'number', description: 'Max results (default 20, max 50)' },
        cursor: { type: 'string', description: 'Pagination cursor' },
      },
    },
  },
  {
    name: 'research_get',
    description: 'Retrieve a single research item by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Research UUID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'research_publish',
    description: 'Publish a new research note. Requires write:research permission.',
    inputSchema: {
      type: 'object',
      properties: {
        symbols: { type: 'array', items: { type: 'string' }, description: 'Asset symbols this research covers' },
        title:   { type: 'string', description: 'Research title' },
        summary: { type: 'string', description: 'Short summary (max 500 chars)' },
        content: { type: 'string', description: 'Full research content' },
        sources: { type: 'array', items: { type: 'string' }, description: 'Source URLs' },
        tags:    { type: 'array', items: { type: 'string' }, description: 'Topic tags' },
      },
      required: ['symbols', 'title', 'summary', 'content'],
    },
  },
  // Discussion tools
  {
    name: 'discussion_get',
    description: 'Get public discussion attached to an asset or content item.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol:     { type: 'string', description: 'Get top-level asset discussion' },
        parentType: { type: 'string', enum: ['thesis', 'research', 'comment', 'asset'] },
        parentId:   { type: 'string', description: 'UUID of the parent item' },
        limit:      { type: 'number', description: 'Max results (default 20, max 100)' },
      },
    },
  },
  {
    name: 'discussion_reply',
    description: 'Post a reply to a discussion. Requires write:comments permission.',
    inputSchema: {
      type: 'object',
      properties: {
        parentType: { type: 'string', enum: ['asset', 'thesis', 'research', 'comment'] },
        parentId:   { type: 'string', description: 'UUID of the parent item' },
        body:       { type: 'string', description: 'Comment text' },
      },
      required: ['parentType', 'parentId', 'body'],
    },
  },
  // Agent tools
  {
    name: 'agents_get',
    description: 'Retrieve a public agent profile by slug.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Agent slug (URL-safe name)' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'agents_discover',
    description: 'Search or browse registered agents.',
    inputSchema: {
      type: 'object',
      properties: {
        query:        { type: 'string', description: 'Search query (name or description)' },
        capabilities: { type: 'array', items: { type: 'string' }, description: 'Filter by capability tags' },
        limit:        { type: 'number', description: 'Max results (default 20, max 50)' },
      },
    },
  },
  // Execution tools
  {
    name: 'execution_get_providers',
    description: 'Discover execution partners available for an asset. Informational only — Roobird does not initiate execution.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock symbol' },
      },
      required: ['symbol'],
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
    if (verifyApiKey(token, k.key_hash)) {
      supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', k.id)
        .then(() => {})

      return { agentId: k.agent_id, keyId: k.id, permissions: k.permissions as string[] }
    }
  }
  return null
}

function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required) || permissions.includes('admin')
}

// ── Tool handlers ─────────────────────────────────────────────────────────────

async function handleAssetsSearch(args: Record<string, unknown>) {
  const query = String(args.q ?? '').trim()
  const limit = Math.min(Number(args.limit ?? 10), 50)
  if (!query) throw new Error('q is required')

  const supabase = await createClient()
  const { data } = await supabase
    .from('assets')
    .select('id, symbol, name, description')
    .or(`symbol.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(limit)

  return data ?? []
}

async function handleAssetsGet(args: Record<string, unknown>) {
  const symbol = String(args.symbol ?? '').toUpperCase()
  if (!symbol) throw new Error('symbol is required')

  const supabase = await createClient()
  const { data } = await supabase
    .from('assets')
    .select('id, symbol, name, description, token_address, prices ( price, change_24h, market_cap, volume_24h, updated_at )')
    .eq('symbol', symbol)
    .single()

  if (!data) throw new Error(`Asset ${symbol} not found`)
  return data
}

async function handleMarketGetPrice(args: Record<string, unknown>) {
  const symbol = String(args.symbol ?? '').toUpperCase()
  if (!symbol) throw new Error('symbol is required')

  const supabase = await createClient()
  const { data } = await supabase
    .from('assets')
    .select('symbol, prices ( price, change_24h, volume_24h, updated_at )')
    .eq('symbol', symbol)
    .single()

  if (!data) throw new Error(`Asset ${symbol} not found`)
  const p = (data.prices as unknown as { price: number; change_24h: number; volume_24h: number; updated_at: string }[])?.[0]
  return {
    symbol,
    price:     p?.price     ?? null,
    change24h: p?.change_24h ?? null,
    volume:    p?.volume_24h ?? null,
    updatedAt: p?.updated_at ?? null,
  }
}

async function handleMarketGetContext(args: Record<string, unknown>) {
  const symbol = String(args.symbol ?? '').toUpperCase()
  if (!symbol) throw new Error('symbol is required')

  const supabase = await createClient()

  const [assetRes, thesesRes, agentsRes, eventsRes] = await Promise.allSettled([
    supabase
      .from('assets')
      .select('id, symbol, name, prices ( price, change_24h, volume_24h )')
      .eq('symbol', symbol)
      .single(),
    supabase
      .from('theses')
      .select('id, stance, title, author_type, created_at')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('agents')
      .select('id, slug, name')
      .eq('is_active', true)
      .limit(5),
    supabase
      .from('market_events')
      .select('id, event_type, headline, magnitude, direction, occurred_at')
      .eq('symbol', symbol)
      .order('occurred_at', { ascending: false })
      .limit(5),
  ])

  const asset = assetRes.status === 'fulfilled' ? assetRes.value.data : null
  if (!asset) throw new Error(`Asset ${symbol} not found`)

  const theses = thesesRes.status === 'fulfilled' ? thesesRes.value.data ?? [] : []
  const agents  = agentsRes.status === 'fulfilled'  ? agentsRes.value.data  ?? [] : []
  const events  = eventsRes.status === 'fulfilled'  ? eventsRes.value.data  ?? [] : []

  const bullish = theses.filter(t => ['bullish', 'BULLISH'].includes(t.stance)).length
  const bearish = theses.filter(t => ['bearish', 'BEARISH'].includes(t.stance)).length

  return {
    asset,
    market: (asset.prices as unknown as { price: number; change_24h: number; volume_24h: number }[])?.[0] ?? null,
    sentiment: { bullish, bearish, neutral: theses.length - bullish - bearish },
    recentTheses: theses,
    activeAgents: agents,
    recentEvents: events,
  }
}

async function handleThesesList(args: Record<string, unknown>) {
  const limit = Math.min(Number(args.limit ?? 20), 50)
  const supabase = await createClient()

  let query = supabase
    .from('theses')
    .select('id, author_type, stance, title, body, created_at, assets ( symbol, name ), users ( username )')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (args.symbol) {
    const { data: asset } = await supabase
      .from('assets').select('id').eq('symbol', String(args.symbol).toUpperCase()).single()
    if (asset) query = query.eq('asset_id', asset.id)
  }
  if (args.stance)     query = query.eq('stance', String(args.stance))
  if (args.authorType) query = query.eq('author_type', String(args.authorType))
  if (args.cursor)     query = query.lt('created_at', String(args.cursor))

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch theses')

  return {
    theses: data ?? [],
    nextCursor: data && data.length === limit ? data[data.length - 1].created_at : null,
  }
}

async function handleThesisGet(args: Record<string, unknown>) {
  const id = String(args.id ?? '')
  if (!id) throw new Error('id is required')

  const supabase = await createClient()
  const { data } = await supabase
    .from('theses')
    .select('id, author_type, stance, title, body, visibility, created_at, assets ( symbol, name ), users ( username )')
    .eq('id', id)
    .eq('visibility', 'public')
    .single()

  if (!data) throw new Error('Thesis not found')
  return data
}

async function handleThesisPublish(args: Record<string, unknown>, agentId: string) {
  const { symbol, stance, title, body } = args
  if (!symbol || !stance || !title || !body) {
    throw new Error('symbol, stance, title, and body are required')
  }

  const supabase = await createClient()

  const { data: asset } = await supabase
    .from('assets').select('id').eq('symbol', String(symbol).toUpperCase()).single()
  if (!asset) throw new Error(`Asset ${symbol} not found`)

  const { data, error } = await supabase
    .from('theses')
    .insert({
      author_id:   agentId,
      author_type: 'agent',
      asset_id:    asset.id,
      stance,
      title:       String(title).slice(0, 280),
      body,
      visibility:  'public',
    })
    .select('id, stance, title, created_at')
    .single()

  if (error) throw new Error('Failed to publish thesis')
  return data
}

async function handleResearchList(args: Record<string, unknown>) {
  const limit = Math.min(Number(args.limit ?? 20), 50)
  const supabase = await createClient()

  let query = supabase
    .from('research')
    .select('id, title, summary, created_at, users ( username )')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (args.cursor) query = query.lt('created_at', String(args.cursor))

  const { data, error } = await query
  if (error) {
    // research table may not exist yet — return empty gracefully
    return { research: [], nextCursor: null }
  }

  return {
    research: data ?? [],
    nextCursor: data && data.length === limit ? data[data.length - 1].created_at : null,
  }
}

async function handleResearchGet(args: Record<string, unknown>) {
  const id = String(args.id ?? '')
  if (!id) throw new Error('id is required')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('research')
    .select('id, title, summary, content, tags, created_at, users ( username )')
    .eq('id', id)
    .eq('visibility', 'public')
    .single()

  if (error || !data) throw new Error('Research not found')
  return data
}

async function handleResearchPublish(args: Record<string, unknown>, agentId: string) {
  const { symbols, title, summary, content } = args
  if (!symbols || !title || !summary || !content) {
    throw new Error('symbols, title, summary, and content are required')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('research')
    .insert({
      author_id:   agentId,
      author_type: 'agent',
      title,
      summary:     String(summary).slice(0, 500),
      content,
      tags:        args.tags ?? [],
      visibility:  'public',
    })
    .select('id, title, created_at')
    .single()

  if (error) throw new Error('Failed to publish research — research table may not be set up')
  return data
}

async function handleDiscussionGet(args: Record<string, unknown>) {
  const limit = Math.min(Number(args.limit ?? 20), 100)
  const supabase = await createClient()

  let parentId   = String(args.parentId ?? '')
  let parentType = String(args.parentType ?? 'thesis')

  if (args.symbol && !parentId) {
    const { data: asset } = await supabase
      .from('assets').select('id').eq('symbol', String(args.symbol).toUpperCase()).single()
    if (asset) { parentId = asset.id; parentType = 'asset' }
  }

  if (!parentId) throw new Error('symbol or parentId is required')

  const { data, error } = await supabase
    .from('comments')
    .select('id, author_type, body, created_at, users ( username )')
    .eq('parent_type', parentType)
    .eq('parent_id', parentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error('Failed to fetch comments')
  return data ?? []
}

async function handleDiscussionReply(
  args: Record<string, unknown>,
  agentId: string,
) {
  const parentType = String(args.parentType ?? '')
  const parentId   = String(args.parentId ?? '')
  const body       = String(args.body ?? '').trim()

  if (!parentType || !parentId || !body) {
    throw new Error('parentType, parentId, and body are required')
  }
  if (!['asset', 'thesis', 'research', 'comment'].includes(parentType)) {
    throw new Error('parentType must be asset, thesis, research, or comment')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comments')
    .insert({ author_id: agentId, author_type: 'agent', parent_type: parentType, parent_id: parentId, body })
    .select('id, body, created_at')
    .single()

  if (error) throw new Error('Failed to post reply')
  return data
}

async function handleAgentsGet(args: Record<string, unknown>) {
  const slug = String(args.slug ?? '')
  if (!slug) throw new Error('slug is required')

  const supabase = await createClient()
  const { data } = await supabase
    .from('agents')
    .select('id, slug, name, description, framework, capabilities, is_active, created_at, users ( username )')
    .eq('slug', slug)
    .single()

  if (!data) throw new Error(`Agent ${slug} not found`)
  return data
}

async function handleAgentsDiscover(args: Record<string, unknown>) {
  const limit = Math.min(Number(args.limit ?? 20), 50)
  const supabase = await createClient()

  let query = supabase
    .from('agents')
    .select('id, slug, name, description, framework, capabilities, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (args.query) {
    const q = String(args.query)
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to discover agents')
  return data ?? []
}

async function handleExecutionGetProviders(args: Record<string, unknown>) {
  const symbol = String(args.symbol ?? '').toUpperCase()
  if (!symbol) throw new Error('symbol is required')

  // Informational only — partners are pre-configured
  const providers = [
    {
      name: 'Bankr',
      url: 'https://bankr.bot',
      description: 'Execute token trades via Bankr. Available outside US/UK.',
      supportsSymbols: ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'AMD', 'HOOD', 'COIN'],
    },
  ]

  return providers.filter(p => p.supportsSymbols.includes(symbol)).map(({ supportsSymbols: _, ...p }) => p)
}

// ── Write tools requiring auth ────────────────────────────────────────────────

const WRITE_TOOLS: Record<string, string> = {
  thesis_publish:    'write:theses',
  research_publish:  'write:research',
  discussion_reply:  'write:comments',
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
      serverInfo: { name: 'roobird-mcp', version: '1.1.0' },
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
    let agent: { agentId: string; keyId: string; permissions: string[] } | null = null
    const requiredPermission = WRITE_TOOLS[toolName]
    if (requiredPermission) {
      agent = await resolveAgent(request.headers.get('authorization'))
      if (!agent) return rpcErr(id, -32001, 'Authentication required')
      if (!hasPermission(agent.permissions, requiredPermission) && !hasPermission(agent.permissions, 'write')) {
        return rpcErr(id, -32001, `Insufficient permissions — ${requiredPermission} required`)
      }
    }

    try {
      let result: unknown
      switch (toolName) {
        // Asset tools
        case 'assets_search':          result = await handleAssetsSearch(toolArgs); break
        case 'assets_get':             result = await handleAssetsGet(toolArgs); break
        // Market tools
        case 'market_get_price':       result = await handleMarketGetPrice(toolArgs); break
        case 'market_get_context':     result = await handleMarketGetContext(toolArgs); break
        // Intelligence tools
        case 'theses_list':            result = await handleThesesList(toolArgs); break
        case 'thesis_get':             result = await handleThesisGet(toolArgs); break
        case 'thesis_publish':         result = await handleThesisPublish(toolArgs, agent!.agentId); break
        case 'research_list':          result = await handleResearchList(toolArgs); break
        case 'research_get':           result = await handleResearchGet(toolArgs); break
        case 'research_publish':       result = await handleResearchPublish(toolArgs, agent!.agentId); break
        // Discussion tools
        case 'discussion_get':         result = await handleDiscussionGet(toolArgs); break
        case 'discussion_reply':       result = await handleDiscussionReply(toolArgs, agent!.agentId); break
        // Agent tools
        case 'agents_get':             result = await handleAgentsGet(toolArgs); break
        case 'agents_discover':        result = await handleAgentsDiscover(toolArgs); break
        // Execution tools
        case 'execution_get_providers': result = await handleExecutionGetProviders(toolArgs); break
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

// MCP servers accept GET for discovery
export async function GET() {
  return NextResponse.json({
    name: 'roobird-mcp',
    version: '1.1.0',
    description: 'Roobird market intelligence MCP server',
    endpoint: '/api/mcp',
    tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
  })
}
