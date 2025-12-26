'use client';

import Link from 'next/link';

export interface HeaderProps {
  brandName?: string;
  loginHref?: string;
  signupHref?: string;
}

export function Header({
  brandName = 'QUICKSNAP',
  loginHref = '/login',
  signupHref = '/register'
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 md:px-12 md:py-6">
      <nav className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-sm flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-lg font-light tracking-[0.15em] text-white">{brandName}</span>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href={loginHref}
            className="text-sm font-light tracking-wider text-white/70 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href={signupHref}
            className="px-5 py-2 text-sm font-light tracking-wider text-white bg-violet-600 hover:bg-violet-500 transition-all border border-violet-500"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Header;

