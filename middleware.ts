import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // Define protected routes - removed /chat to make it publicly accessible
  const protectedRoutes = ['/memories'];
  const authRoutes = ['/auth/signin', '/auth/signup', '/auth/forgot-password'];

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAuthRoute = authRoutes.some(route => path.startsWith(route));

  // Get session from cookies
  const session = request.cookies.get('sb-access-token');

  // If accessing protected route without session, redirect to sign in
  if (isProtectedRoute && !session) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(signInUrl);
  }

  // If accessing auth route with session, redirect to home
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 