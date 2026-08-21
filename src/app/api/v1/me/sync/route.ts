import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Errors.unauthorized()

  const body = await request.json()
  const { avatar_url, username } = body

  const updates: Record<string, string> = {}
  if (avatar_url && typeof avatar_url === 'string') updates.avatar_url = avatar_url
  if (username && typeof username === 'string') updates.username = username

  if (Object.keys(updates).length === 0) return ok({ updated: false })

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)

  if (error) return Errors.internal()

  return ok({ updated: true })
}
