import { createHash, createHmac } from 'crypto'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Errors, ok } from '@/lib/api/response'

type LinkedAccount = {
  type?: string
  address?: string
  username?: string
  profile_picture_url?: string
}

type PrivyUser = {
  id?: string
  linked_accounts?: LinkedAccount[]
}

function syntheticEmail(privyUserId: string) {
  const id = createHash('sha256').update(privyUserId).digest('hex').slice(0, 32)
  return `${id}@privy.roobird.app`
}

function derivePassword(privyUserId: string, secret: string) {
  return createHmac('sha256', secret).update(`privy:${privyUserId}`).digest('hex')
}

function cleanUsername(value: string) {
  return value.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '').slice(0, 24)
}

export async function POST(request: Request) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? 'cmt1l660402040chzny0abq42'
  const secret = process.env.API_KEY_SECRET
  const authorization = request.headers.get('authorization') ?? ''

  if (!authorization.startsWith('Bearer ')) return Errors.unauthorized()
  if (!secret) {
    console.error('API_KEY_SECRET is required for the Privy/Supabase session bridge')
    return Errors.internal()
  }

  const privyResponse = await fetch('https://auth.privy.io/api/v1/users/me', {
    headers: { authorization, 'privy-app-id': appId },
    cache: 'no-store',
  })

  if (!privyResponse.ok) return Errors.unauthorized()

  const privyUser = await privyResponse.json() as PrivyUser
  if (!privyUser.id) return Errors.unauthorized()

  const accounts = privyUser.linked_accounts ?? []
  const wallet = accounts.find(account => account.type === 'wallet')?.address?.toLowerCase() ?? null
  const twitter = accounts.find(account => account.type === 'twitter_oauth')
  const emailAccount = accounts.find(account => account.type === 'email')
  const username = twitter?.username ? cleanUsername(twitter.username) : null
  const email = syntheticEmail(privyUser.id)
  const password = derivePassword(privyUser.id, secret)
  const service = await createServiceClient()

  const { error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      privy_user_id: privyUser.id,
      wallet_address: wallet,
      contact_email: emailAccount?.address ?? null,
      twitter_username: twitter?.username ?? null,
    },
  })

  if (createError && !createError.message.toLowerCase().includes('already')) {
    console.error('failed to create bridged Supabase user', createError.message)
    return Errors.internal()
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.session || !data.user) {
    console.error('failed to create bridged Supabase session', error?.message)
    return Errors.internal()
  }

  const profileUpdates: Record<string, string> = {}
  if (wallet) profileUpdates.wallet_address = wallet
  if (twitter?.profile_picture_url) profileUpdates.avatar_url = twitter.profile_picture_url

  if (Object.keys(profileUpdates).length) {
    const { error: profileError } = await service.from('users').update(profileUpdates).eq('id', data.user.id)
    if (profileError) console.error('failed to sync bridged profile', profileError.message)
  }

  if (username) {
    const { error: usernameError } = await service.from('users').update({ username }).eq('id', data.user.id)
    if (usernameError && usernameError.code !== '23505') {
      console.error('failed to sync bridged username', usernameError.message)
    }
  }

  return ok({
    user: { id: data.user.id },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
  })
}
