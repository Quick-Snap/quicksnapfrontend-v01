'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LayoutDashboard, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import DriftWall from '@/components/DriftWall/DriftWall';
import { TrustRibbon } from './TrustRibbon';
import { useAuthStore } from '@/stores';

const EVENT_PHOTOS = [
  { image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80', title: 'Wedding moment' },
  { image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80', title: 'Celebration' },
  { image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80', title: 'Reception' },
  { image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80', title: 'Conference' },
  { image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80', title: 'Festival lights' },
  { image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80', title: 'Concert crowd' },
  { image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80', title: 'Party night' },
  { image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80', title: 'Stage lights' },
  { image: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=600&q=80', title: 'Dance floor' },
  { image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&q=80', title: 'Guests laughing' },
  { image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80', title: 'DJ booth' },
  { image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&q=80', title: 'Dinner toast' },
  { image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80', title: 'Live music' },
  { image: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=600&q=80', title: 'Outdoor event' },
  { image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80', title: 'Crowd energy' },
  { image: 'https://images.unsplash.com/photo-1496024840928-4c417adf211d?w=600&q=80', title: 'Night festival' },
  { image: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=600&q=80', title: 'Wedding aisle' },
  { image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80', title: 'Corporate gala' },
  { image: 'https://images.unsplash.com/photo-1546961342-ea5f71b193f3?w=600&q=80', title: 'Friends posing' },
  { image: 'https://images.unsplash.com/photo-1508997449629-303059a039c0?w=600&q=80', title: 'Arena event' },
];

export interface DriftWallHeroProps {
  signupHref?: string;
  loginHref?: string;
  brandName?: string;
}

export function DriftWallHero({
  signupHref = '/register',
  loginHref = '/login',
}: DriftWallHeroProps) {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = !!user;
  const isOrganizerOrAdmin = user?.role === 'organizer' || user?.role === 'admin' || user?.role === 'photographer';
  const firstName = user?.name ? user.name.trim().split(' ')[0] : (user?.email ? user.email.split('@')[0] : '');

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#060010]">
      {/* Drift wall background */}
      <div className="absolute inset-0 z-0">
        <DriftWall
          items={EVENT_PHOTOS}
          columns={6}
          tileWidth={220}
          tileHeight={148}
          gap={16}
          radius={12}
          tilt={14}
          turn={-12}
          depth={140}
          speed={38}
          direction="up"
          variance={0.4}
          parallax={0.55}
          lift={72}
          fade={0.55}
          dim={0.45}
          grayscale={false}
          overlayColor="#060010"
        />
      </div>

      {/* Soft vignette so brand copy stays readable */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(6,0,16,0.35)_45%,rgba(6,0,16,0.88)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-1/3 bg-gradient-to-t from-[#060010] to-transparent"
        aria-hidden
      />

      {/* Hero copy — brand first */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pb-28 pt-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          {isLoggedIn && firstName ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-400/40 bg-violet-950/70 backdrop-blur-md text-violet-200 text-xs sm:text-sm font-medium tracking-wide shadow-xl shadow-violet-600/30"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Welcome back, {firstName} 👋</span>
            </motion.div>
          ) : null}

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mb-5 font-display text-5xl font-extrabold tracking-[-0.04em] text-white sm:text-6xl md:text-7xl lg:text-8xl"
          >
            Roo
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              pixo
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mb-3 font-display text-xl font-medium tracking-[-0.02em] text-violet-300 sm:text-2xl md:text-3xl"
          >
            {isLoggedIn && firstName
              ? isOrganizerOrAdmin
                ? `Ready to host your next event, ${firstName}?`
                : `Planning your next celebration or wedding, ${firstName}?`
              : 'Your photos. One selfie away.'}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mx-auto mb-10 max-w-lg text-base font-light leading-relaxed tracking-wide text-white/55 md:text-lg"
          >
            {isLoggedIn
              ? isOrganizerOrAdmin
                ? 'Launch a live big-screen photo wall, upload batch galleries, or manage your studio events.'
                : 'Relive your matched event memories on your dashboard, or host your own celebration with an interactive AI photo wall.'
              : 'AI face matching finds every shot of you at the event — instantly.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-2.5 px-8 py-4 font-display text-sm font-semibold tracking-[0.08em] text-white transition-all border border-violet-500 bg-violet-600 hover:bg-violet-500 shadow-xl shadow-violet-600/30 rounded-none"
                >
                  <LayoutDashboard className="w-4 h-4 text-violet-200 group-hover:scale-110 transition-transform" />
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-violet-300 group-hover:translate-x-1 transition-transform" />
                </Link>

                {isOrganizerOrAdmin ? (
                  <Link
                    href="/studio"
                    className="inline-flex items-center gap-2 px-8 py-4 font-display text-sm font-semibold tracking-[0.08em] text-white transition-all border border-violet-500/30 bg-white/5 hover:bg-white/10 hover:border-violet-500/60 backdrop-blur-sm"
                  >
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span>Open Studio Suite</span>
                  </Link>
                ) : (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-8 py-4 font-display text-sm font-semibold tracking-[0.08em] text-white transition-all border border-violet-500/30 bg-white/5 hover:bg-white/10 hover:border-violet-500/60 backdrop-blur-sm"
                  >
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span>Host Your Next Event</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href={signupHref}
                  className="px-8 py-4 font-display text-sm font-semibold tracking-[0.08em] text-white transition-all border border-violet-500 bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/20"
                >
                  Get Started Free
                </Link>
                <Link
                  href={loginHref}
                  className="px-8 py-4 font-display text-sm font-semibold tracking-[0.08em] text-white transition-all border border-white/15 bg-white/5 hover:bg-white/10"
                >
                  Sign In
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Community trust ribbon */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute inset-x-0 bottom-0 z-20"
      >
        <TrustRibbon />
      </motion.div>
    </div>
  );
}

export default DriftWallHero;
