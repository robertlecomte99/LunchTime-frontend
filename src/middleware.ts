import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. On récupère le token dans les cookies (plus fiable que le localStorage pour le middleware)
  const token = request.cookies.get('token')?.value

  // 2. On définit les routes à protéger
  const isDashboardPage = request.nextUrl.pathname.startsWith('/admin')

  // 3. Si l'utilisateur tente d'aller sur /admin sans token, on le redirige vers /login
  if (isDashboardPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// On indique à Next.js d'exécuter ce middleware que sur les routes /admin
export const config = {
  matcher: ['/admin/:path*'],
}