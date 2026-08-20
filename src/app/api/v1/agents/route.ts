import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const cursor = searchParams.get('cursor')

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

  if (cursor) query = query.lt('created_at', cursor)

  const { data, error } = await query
  if (error) return Errors.internal()

  const nextCursor = data.length === limit ? data[data.length - 1].created_at : null

  return ok({ agents: data, next_cursor: nextCursor })
}
