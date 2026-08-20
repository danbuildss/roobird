import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

// GET /api/v1/agents/audit?agent_id=<id>&limit=50
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Errors.unauthorized()

  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agent_id')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)

  if (!agentId) return Errors.badRequest('agent_id required')

  const { data: agent } = await supabase
    .from('agents')
    .select('id, owner_id')
    .eq('id', agentId)
    .single()

  if (!agent) return Errors.notFound()
  if (agent.owner_id !== user.id) return Errors.forbidden()

  const { data, error } = await supabase
    .from('agent_audit_log')
    .select('id, action, target_type, target_id, meta, created_at, api_keys ( label )')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return Errors.internal()
  return ok({ entries: data ?? [] })
}

// POST /api/v1/agents/audit — internal: called by agent write routes
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Errors.unauthorized()

  const body = await request.json()
  const { agent_id, api_key_id, action, target_type, target_id, meta } = body

  if (!agent_id || !action) return Errors.badRequest('agent_id and action required')

  const { data: agent } = await supabase
    .from('agents')
    .select('id, owner_id')
    .eq('id', agent_id)
    .single()

  if (!agent) return Errors.notFound()
  if (agent.owner_id !== user.id) return Errors.forbidden()

  const { data, error } = await supabase
    .from('agent_audit_log')
    .insert({ agent_id, api_key_id: api_key_id ?? null, action, target_type, target_id, meta })
    .select('id, created_at')
    .single()

  if (error) return Errors.internal()
  return ok(data, 201)
}
