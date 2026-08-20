import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SiweMessage } from 'siwe'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Errors, ok } from '@/lib/api/response'
import { createHmac, randomBytes } from 'crypto'

function derivePassword(walletAddress: string): string {
  return createHmac('sha256', process.env.API_KEY_SECRET!)
    .update(walletAddress.toLowerCase())
    .digest('hex')
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const storedNonce = cookieStore.get('siwe_nonce')?.value

  if (!storedNonce) {
    return Errors.badRequest('Missing nonce — request a new one from /api/auth/siwe/nonce')
  }

  const { message, signature } = await request.json()

  if (!message || !signature) {
    return Errors.badRequest('message and signature are required')
  }

  // Verify the SIWE signature
  let siweMessage: SiweMessage
  try {
    siweMessage = new SiweMessage(message)
    const { success, error } = await siweMessage.verify({ signature, nonce: storedNonce })
    if (!success) throw error
  } catch {
    return Errors.badRequest('Invalid signature or message')
  }

  const walletAddress = siweMessage.address.toLowerCase()
  const serviceClient = await createServiceClient()

  // Look up existing user by wallet address in public.users
  const { data: existingUser } = await serviceClient
    .from('users')
    .select('id, email')
    .eq('wallet_address', walletAddress)
    .single()

  const email = existingUser?.email ?? `${walletAddress}@wallet.roobird.app`
  const password = derivePassword(walletAddress)

  if (!existingUser) {
    // Create auth user — trigger will sync to public.users
    const { error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { wallet_address: walletAddress },
    })
    if (createError && createError.message !== 'User already registered') {
      return Errors.internal()
    }
  }

  // Sign in to get a real session
  const anonClient = await createClient()
  const { data: session, error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError || !session) return Errors.internal()

  // Clear the used nonce
  cookieStore.delete('siwe_nonce')

  return ok({ user: session.user })
}
