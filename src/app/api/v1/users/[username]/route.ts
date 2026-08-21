import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, username, avatar_url, bio, created_at')
    .eq('username', username)
    .single()

  if (error || !data) return Errors.notFound(`User ${username} not found`)
  return ok(data)
}
