import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status })
}

export function err(code: string, message: string, status: number) {
  return NextResponse.json({ data: null, error: { code, message, status } }, { status })
}

export const Errors = {
  notFound: (msg = 'Not found') => err('not_found', msg, 404),
  badRequest: (msg = 'Bad request') => err('bad_request', msg, 400),
  unauthorized: () => err('unauthorized', 'Authentication required', 401),
  forbidden: () => err('forbidden', 'Access denied', 403),
  internal: () => err('internal_error', 'Internal server error', 500),
}
