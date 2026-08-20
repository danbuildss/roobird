import { createClient } from '@/lib/supabase/server'
import { ok, Errors } from '@/lib/api/response'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agents')
    .select(`
      id, slug, name, description, avatar_url, framework,
      endpoint_url, capabilities, is_active, created_at,
      users ( username, avatar_url )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) return Errors.notFound('Agent not found')

  return ok(data)
}
