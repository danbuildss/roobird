import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Errors.unauthorized()

  const { searchParams } = new URL(request.url)
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '30'), 100)
  const unread = searchParams.get('unread') === 'true'

  let query = supabase
    .from('notifications')
    .select('id, type, payload, read_at, created_at')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unread) query = query.is('read_at', null)

  const { data, error } = await query
  if (error) return Errors.internal()

  const unreadCount = data.filter(n => !n.read_at).length
  return ok({ notifications: data, unread_count: unreadCount })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Errors.unauthorized()

  const body = await request.json()
  const { ids } = body // array of notification IDs, or omit to mark all read

  const now = new Date().toISOString()

  let query = supabase
    .from('notifications')
    .update({ read_at: now })
    .eq('recipient_id', user.id)
    .is('read_at', null)

  if (ids?.length) query = query.in('id', ids)

  const { error } = await query
  if (error) return Errors.internal()

  return ok({ marked_read: true })
}
