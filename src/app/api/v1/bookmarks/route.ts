import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

// GET /api/v1/bookmarks?target_type=asset&target_id=<uuid>
// Returns { bookmarked: boolean }
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ok({ bookmarked: false })

  const { searchParams } = new URL(request.url)
  const target_type = searchParams.get('target_type')
  const target_id   = searchParams.get('target_id')

  if (!target_type || !target_id) return Errors.badRequest('target_type and target_id required')

  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .single()

  return ok({ bookmarked: !!data })
}

// POST /api/v1/bookmarks — add bookmark
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Errors.unauthorized()

  const body = await request.json()
  const { target_type, target_id } = body

  if (!target_type || !target_id) return Errors.badRequest('target_type and target_id required')

  const { data, error } = await supabase
    .from('bookmarks')
    .upsert({ user_id: user.id, target_type, target_id }, { onConflict: 'user_id,target_type,target_id' })
    .select('id')
    .single()

  if (error) return Errors.internal()
  return ok({ bookmarked: true, id: data.id }, 201)
}

// DELETE /api/v1/bookmarks?target_type=asset&target_id=<uuid>
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Errors.unauthorized()

  const { searchParams } = new URL(request.url)
  const target_type = searchParams.get('target_type')
  const target_id   = searchParams.get('target_id')

  if (!target_type || !target_id) return Errors.badRequest('target_type and target_id required')

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('target_type', target_type)
    .eq('target_id', target_id)

  if (error) return Errors.internal()
  return ok({ bookmarked: false })
}
