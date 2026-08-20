import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parentId   = searchParams.get('parent_id')
  const parentType = searchParams.get('parent_type') ?? 'thesis'
  const limit      = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
  const cursor     = searchParams.get('cursor')

  if (!parentId) return Errors.badRequest('parent_id required')

  const supabase = await createClient()

  let query = supabase
    .from('comments')
    .select(`
      id, author_id, author_type, parent_type, parent_id, body, created_at,
      users ( username, avatar_url )
    `)
    .eq('parent_type', parentType)
    .eq('parent_id', parentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (cursor) query = query.gt('created_at', cursor)

  const { data, error } = await query
  if (error) return Errors.internal()

  const nextCursor = data.length === limit ? data[data.length - 1].created_at : null
  return ok({ comments: data, next_cursor: nextCursor })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Errors.unauthorized()

  const body = await request.json()
  const { parent_type = 'thesis', parent_id, body: commentBody } = body

  if (!parent_id || !commentBody?.trim()) {
    return Errors.badRequest('parent_id and body are required')
  }

  if (!['thesis', 'research', 'comment', 'asset'].includes(parent_type)) {
    return Errors.badRequest('invalid parent_type')
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      author_id: user.id,
      author_type: 'human',
      parent_type,
      parent_id,
      body: commentBody.trim(),
    })
    .select(`
      id, author_id, author_type, parent_type, parent_id, body, created_at,
      users ( username, avatar_url )
    `)
    .single()

  if (error) return Errors.internal()

  // Create notification for thesis author
  if (parent_type === 'thesis') {
    const { data: thesis } = await supabase
      .from('theses')
      .select('author_id, title')
      .eq('id', parent_id)
      .single()

    if (thesis && thesis.author_id !== user.id) {
      await supabase.from('notifications').insert({
        recipient_id: thesis.author_id,
        type: 'reply_thesis',
        payload: {
          thesis_id: parent_id,
          thesis_title: thesis.title,
          comment_id: data.id,
          commenter_id: user.id,
        },
      })
    }
  }

  return ok(data, 201)
}
