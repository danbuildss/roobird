import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol    = searchParams.get('symbol')
  const stance    = searchParams.get('stance')
  const author_id = searchParams.get('author_id')
  const limit     = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const cursor    = searchParams.get('cursor')

  const supabase = await createClient()

  let query = supabase
    .from('theses')
    .select(`
      id, author_id, author_type, asset_id, stance, title, body, visibility, created_at,
      assets ( symbol, name ),
      users ( username, avatar_url )
    `)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (symbol) {
    const { data: asset } = await supabase
      .from('assets')
      .select('id')
      .eq('symbol', symbol.toUpperCase())
      .single()
    if (asset) query = query.eq('asset_id', asset.id)
  }

  if (stance)    query = query.eq('stance', stance)
  if (author_id) query = query.eq('author_id', author_id)
  if (cursor)    query = query.lt('created_at', cursor)

  const { data, error } = await query
  if (error) return Errors.internal()

  const nextCursor = data.length === limit ? data[data.length - 1].created_at : null

  return ok({ theses: data, next_cursor: nextCursor })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Errors.unauthorized()

  const body = await request.json()
  const { asset_id, stance, title, body: thesisBody = '', visibility = 'public' } = body

  if (!asset_id || !stance || !title) {
    return Errors.badRequest('asset_id, stance, and title are required')
  }

  if (!['bullish', 'bearish', 'neutral', 'research', 'question'].includes(stance)) {
    return Errors.badRequest('stance must be bullish, bearish, neutral, research, or question')
  }

  const { data, error } = await supabase
    .from('theses')
    .insert({
      author_id: user.id,
      author_type: 'human',
      asset_id,
      stance,
      title,
      body: thesisBody,
      visibility,
    })
    .select()
    .single()

  if (error) return Errors.internal()

  return ok(data, 201)
}
