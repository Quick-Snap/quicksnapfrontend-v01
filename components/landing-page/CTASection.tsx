'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LayoutDashboard, Sparkles, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores';

export interface CTASectionProps {
  title?: string;
  subtitle?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  signupHref?: string;
  loginHref?: string;
  contactHref?: string;
}

export function CTASection({
  title = "Ready to Transform Your Events?",
  subtitle = "Join thousands of event organizers and photographers who trust Roopixo.",
  primaryButtonText = "Start Free Trial",
  secondaryButtonText = "Contact Sales",
  signupHref = '/register',
  loginHref = '/login',
  contactHref = '/contact'
}: CTASectionProps) {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = !!user;
  const isOrganizerOrAdmin = user?.role === 'organizer' || user?.role === 'admin' || user?.role === 'photographer';

  const headingText = isLoggedIn
    ? `Ready for Your Next Event, ${user.name?.split(' ')[0] || 'there'}?`
    : title;

  const subText = isLoggedIn
    ? "Manage your live event galleries, view guest candid moments, or explore plan upgrades."
    : subtitle;

  return (
    <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-white dark:bg-[#0a0a0a] border-t border-zinc-200/80 dark:border-white/5 transition-colors duration-200">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto text-center relative z-10 w-full"
      >
        <div className="mb-6 sm:mb-8 h-px w-16 bg-violet-500/50 mx-auto" />
        <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-zinc-900 dark:text-white mb-4 sm:mb-6 leading-tight">
          {headingText}
        </h2>
        <p className="text-zinc-600 dark:text-white/50 max-w-xl mx-auto text-sm sm:text-base md:text-lg font-light leading-relaxed mb-8 sm:mb-10">
          {subText}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-display text-sm font-semibold tracking-[0.08em] transition-all border border-violet-500 shadow-xl shadow-violet-600/30"
              >
                <LayoutDashboard className="w-4 h-4 text-violet-200" />
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4 text-violet-300 group-hover:translate-x-1 transition-transform" />
              </Link>
              {isOrganizerOrAdmin ? (
                <Link
                  href="/studio"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-900 dark:text-white font-display text-sm font-semibold tracking-[0.08em] transition-all border border-violet-400 dark:border-violet-500/40"
                >
                  <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                  <span>Open Studio Suite</span>
                </Link>
              ) : (
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-900 dark:text-white font-display text-sm font-semibold tracking-[0.08em] transition-all border border-violet-400 dark:border-violet-500/40"
                >
                  <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                  <span>Become an Organizer</span>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href={signupHref}
                className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-display text-sm font-semibold tracking-[0.08em] transition-all border border-violet-500 shadow-lg shadow-violet-600/20"
              >
                {primaryButtonText}
              </Link>
              <Link
                href={contactHref}
                className="px-8 py-4 bg-transparent hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-900 dark:text-white font-display text-sm font-semibold tracking-[0.08em] transition-all border border-zinc-300 dark:border-white/20"
              >
                {secondaryButtonText}
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </section>
  );
}

export default CTASection;

