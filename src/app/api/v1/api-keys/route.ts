import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'
import { generateApiKey } from '@/lib/auth/api-key'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Errors.unauthorized()

  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agent_id')

  // Verify user owns the agent
  if (agentId) {
    const { data: agent } = await supabase
      .from('agents')
      .select('id, owner_id')
      .eq('id', agentId)
      .single()

    if (!agent) return Errors.notFound('Agent not found')
    if (agent.owner_id !== user.id) return Errors.forbidden()
  }

  let query = supabase
    .from('api_keys')
    .select('id, agent_id, key_prefix, label, permissions, last_used_at, revoked_at, created_at')
    .is('revoked_at', null)
    .order('created_at', { ascending: false })

  if (agentId) query = query.eq('agent_id', agentId)
  else {
    // Return keys for all of the user's agents
    const { data: agents } = await supabase
      .from('agents')
      .select('id')
      .eq('owner_id', user.id)

    const agentIds = (agents ?? []).map(a => a.id)
    if (agentIds.length === 0) return ok({ api_keys: [] })
    query = query.in('agent_id', agentIds)
  }

  const { data, error } = await query
  if (error) return Errors.internal()

  return ok({ api_keys: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Errors.unauthorized()

  const body = await request.json()
  const { agent_id, label = 'Default key', permissions = ['read'] } = body

  if (!agent_id) return Errors.badRequest('agent_id required')

  // Verify ownership
  const { data: agent } = await supabase
    .from('agents')
    .select('id, owner_id')
    .eq('id', agent_id)
    .single()

  if (!agent) return Errors.notFound('Agent not found')
  if (agent.owner_id !== user.id) return Errors.forbidden()

  const { key, prefix, hash } = generateApiKey()

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      agent_id,
      key_prefix: prefix,
      key_hash: hash,
      label,
      permissions,
    })
    .select('id, agent_id, key_prefix, label, permissions, created_at')
    .single()

  if (error) return Errors.internal()

  // Return the raw key ONCE — it is never stored in plaintext
  return ok({ ...data, key }, 201)
}
