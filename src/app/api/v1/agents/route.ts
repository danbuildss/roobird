import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const cursor = searchParams.get('cursor')
  const owner  = searchParams.get('owner') // 'me' to filter by authenticated user

  const supabase = await createClient()

  let query = supabase
    .from('agents')
    .select(`
      id, slug, name, description, avatar_url, framework,
      capabilities, is_active, created_at,
      users ( username, avatar_url )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (owner === 'me') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Errors.unauthorized()
    query = query.eq('owner_id', user.id)
  }

  if (cursor) query = query.lt('created_at', cursor)

  const { data, error } = await query
  if (error) return Errors.internal()

  const nextCursor = data.length === limit ? data[data.length - 1].created_at : null
  return ok({ agents: data, next_cursor: nextCursor })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Errors.unauthorized()

  const body = await request.json()
  const { slug, name, description, framework = 'REST API', endpoint_url, capabilities = [] } = body

  if (!slug || !name) return Errors.badRequest('slug and name are required')
  if (!/^[a-z0-9-]+$/.test(slug)) return Errors.badRequest('slug must be lowercase alphanumeric with hyphens')

  const { data, error } = await supabase
    .from('agents')
    .insert({
      owner_id: user.id,
      slug,
      name,
      description,
      framework,
      endpoint_url,
      capabilities,
      is_active: true,
    })
    .select('id, slug, name, description, framework, capabilities, created_at')
    .single()

  if (error) {
    if (error.code === '23505') return Errors.badRequest('slug already taken')
    return Errors.internal()
  }

  return ok(data, 201)
}
