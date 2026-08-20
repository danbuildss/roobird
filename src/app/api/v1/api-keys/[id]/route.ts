import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Errors.unauthorized()

  // Verify key belongs to one of the user's agents
  const { data: key } = await supabase
    .from('api_keys')
    .select('id, agent_id, agents ( owner_id )')
    .eq('id', id)
    .single()

  if (!key) return Errors.notFound()

  const ownerOf = (key.agents as unknown as { owner_id: string } | null)?.owner_id
  if (ownerOf !== user.id) return Errors.forbidden()

  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return Errors.internal()
  return ok({ revoked: true })
}
