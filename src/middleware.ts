import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. On récupère le token dans les cookies (plus fiable que le localStorage pour le middleware)
  const token = request.cookies.get('token')?.value
  const role = request.cookies.get('role')?.value; 

  // 2. On définit les routes à protéger

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/login';
  const isAdminPage = pathname.startsWith('/admin');
  // --- 1. SÉCURITÉ DE BASE : AUTHENTIFICATION ---
  // Si l'utilisateur n'est pas connecté et tente d'accéder à autre chose que le login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // --- 2. GESTION DU LOGIN ---
  // Si l'utilisateur est déjà connecté et va sur /login, on le redirige selon son rôle
  if (token && isLoginPage) {
    return role === 'admin' 
      ? NextResponse.redirect(new URL('/admin', request.url)) 
      : NextResponse.redirect(new URL('/', request.url));
  }

  // --- 3. AUTORISATIONS PAR RÔLE ---
  // RÈGLE : Un client peut PAS aller en Admin
  if (isAdminPage && role !== 'admin') {
    // On le renvoie vers la racine (le menu)
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Très important : on inclut la racine "/" dans le matcher
export const config = {
  matcher: ['/', '/admin/:path*', '/login'],
};