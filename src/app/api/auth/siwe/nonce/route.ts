import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { generateNonce } from 'siwe'

export async function GET() {
  const nonce = generateNonce()
  const cookieStore = await cookies()

  cookieStore.set('siwe_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 300, // 5 minutes
    path: '/',
  })

  return NextResponse.json({ nonce })
}
