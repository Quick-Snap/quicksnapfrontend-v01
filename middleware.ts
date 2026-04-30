import { auth } from '@/auth';
import { NextResponse } from 'next/server';

/**
 * Example protection for NextAuth (Google) sessions. Routes that rely only on
 * email/password + Zustand are unchanged; add matchers here if you move those
 * flows behind Auth.js as well.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/protected-example') && !req.auth) {
    const login = new URL('/login', req.nextUrl);
    login.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/protected-example', '/protected-example/:path*'],
};
