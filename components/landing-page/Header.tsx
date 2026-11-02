'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/app/components/ui/ThemeToggle';
import { useAuthStore } from '@/stores';

export interface HeaderProps {
  brandName?: string;
  loginHref?: string;
  signupHref?: string;
}

export function Header({
  loginHref = '/login',
  signupHref = '/register',
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = !!user;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 sm:px-6 sm:py-3.5 md:px-10 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-200/80 dark:border-white/[0.06] transition-colors duration-200">
      <nav className="flex items-center justify-between max-w-7xl mx-auto">
        <BrandLogo href="/" size="md" tone="auto" />

        {/* Desktop Anchor Navigation */}
        <div className="hidden lg:flex items-center gap-7">
          <a
            href="#landing-features"
            className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-600 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#landing-audience"
            className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-600 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white transition-colors"
          >
            Audience
          </a>
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
          >
            <span>Demo</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-white bg-violet-600 rounded-full animate-pulse">
              LIVE
            </span>
          </Link>
          <a
            href="#landing-how-it-works"
            className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-600 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white transition-colors"
          >
            How It Works
          </a>
          <Link
            href="/pricing"
            className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-600 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <a
            href="#landing-testimonials"
            className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-600 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white transition-colors"
          >
            Stories
          </a>
          <a
            href="#landing-faq"
            className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-600 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white transition-colors"
          >
            FAQ
          </a>
        </div>

        <div className="hidden sm:flex items-center gap-3 md:gap-4">
          <ThemeToggle size="navbar" className="shrink-0" />
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 font-display text-sm font-semibold tracking-[0.06em] text-white bg-violet-600 hover:bg-violet-500 transition-all border border-violet-500 rounded-lg shadow-lg shadow-violet-500/25"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                href={loginHref}
                className="text-sm font-medium tracking-wide text-zinc-700 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href={signupHref}
                className="px-4 py-2 md:px-5 font-display text-sm font-semibold tracking-[0.06em] text-white bg-violet-600 hover:bg-violet-500 transition-all border border-violet-500 rounded-lg shadow-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle size="sm" className="shrink-0" />
          <button
            className="p-2 text-zinc-700 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-zinc-200 dark:border-white/10 py-5 px-5 animate-fade-in shadow-xl transition-colors">
          <div className="flex flex-col gap-3 max-w-7xl mx-auto">
            <div className="flex flex-col gap-2 pb-3 border-b border-zinc-200 dark:border-white/10 text-center">
              <a
                href="#landing-features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm text-zinc-700 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white font-medium"
              >
                Features
              </a>
              <a
                href="#landing-audience"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm text-zinc-700 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white font-medium"
              >
                Audience
              </a>
              <Link
                href="/demo"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 flex items-center justify-center gap-1.5"
              >
                <span>Interactive Demo</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-violet-600 rounded-full animate-pulse">
                  LIVE
                </span>
              </Link>
              <a
                href="#landing-how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm text-zinc-700 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white font-medium"
              >
                How It Works
              </a>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm text-zinc-700 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white font-medium"
              >
                Pricing
              </Link>
              <a
                href="#landing-testimonials"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm text-zinc-700 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white font-medium"
              >
                Stories
              </a>
              <a
                href="#landing-faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm text-zinc-700 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white font-medium"
              >
                FAQ
              </a>
            </div>

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 text-center font-display text-sm font-semibold tracking-[0.06em] text-white bg-violet-600 hover:bg-violet-500 transition-all border border-violet-500 rounded-lg flex items-center justify-center gap-2 shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href={loginHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 text-center text-sm font-medium tracking-wide text-zinc-800 hover:text-zinc-950 dark:text-white/70 dark:hover:text-white transition-colors border border-zinc-300 dark:border-white/10 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
                >
                  Sign In
                </Link>
                <Link
                  href={signupHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 text-center font-display text-sm font-semibold tracking-[0.06em] text-white bg-violet-600 hover:bg-violet-500 transition-all border border-violet-500 rounded-lg shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
