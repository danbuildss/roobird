import { createClient } from '@/lib/supabase/server'
import { Errors, err, ok } from '@/lib/api/response'
import { executionRateLimited } from '@/lib/execution/rate-limit'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Errors.unauthorized()
  if (executionRateLimited(`status:${user.id}`, 30)) return err('rate_limited', 'Status polling limit exceeded', 429)

  const { data, error } = await supabase
    .from('execution_intents')
    .select('id, execution_mode, requested_amount, estimated_output, transaction_hash, status, error_code, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return Errors.notFound('Execution intent not found')
  return ok(data)
}
