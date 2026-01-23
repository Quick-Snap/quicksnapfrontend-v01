'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 sm:px-6 sm:py-4 md:px-12 md:py-6">
      <nav className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-sm flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-base sm:text-lg font-light tracking-[0.1em] sm:tracking-[0.15em] text-white">{brandName}</span>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden sm:flex items-center gap-3 md:gap-4">
          <Link
            href={loginHref}
            className="text-sm font-light tracking-wider text-white/70 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href={signupHref}
            className="px-4 py-2 md:px-5 text-sm font-light tracking-wider text-white bg-violet-600 hover:bg-violet-500 transition-all border border-violet-500"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="sm:hidden p-2 text-white/70 hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 py-4 px-4 animate-fade-in">
          <div className="flex flex-col gap-3 max-w-7xl mx-auto">
            <Link
              href={loginHref}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center text-sm font-light tracking-wider text-white/70 hover:text-white transition-colors border border-white/10 rounded-lg hover:bg-white/5"
            >
              Sign In
            </Link>
            <Link
              href={signupHref}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center text-sm font-light tracking-wider text-white bg-violet-600 hover:bg-violet-500 transition-all border border-violet-500 rounded-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
