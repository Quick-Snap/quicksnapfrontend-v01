'use client';

import { motion } from 'framer-motion';
import { Zap, Smartphone, Sparkles, Image, Tv } from 'lucide-react';

const STATS = [
  {
    icon: Zap,
    value: '< 2.0s',
    label: 'Face Match Speed',
    detail: 'Instant biometric indexing',
  },
  {
    icon: Smartphone,
    value: '0 Downloads',
    label: '100% Web App',
    detail: 'Instant QR code access in browser',
  },
  {
    icon: Sparkles,
    value: '99.4%',
    label: 'Matching Accuracy',
    detail: 'Enterprise AI face recognition',
  },
  {
    icon: Tv,
    value: 'Live Wall',
    label: 'Real-Time Projection',
    detail: 'Streamed directly to venue screens',
  },
  {
    icon: Image,
    value: '100K+',
    label: 'Delivered Memories',
    detail: 'Across weddings & conferences',
  },
];

export function MetricsRibbon() {
  return (
    <section className="relative py-12 px-6 border-y border-zinc-200/80 bg-white/90 dark:border-white/[0.08] dark:bg-[#070312]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center p-3"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-600 dark:bg-violet-600/15 dark:border-violet-500/30 dark:text-violet-400 mb-3 shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300/90 mb-1">
                  {stat.label}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-white/45 font-medium dark:font-light">
                  {stat.detail}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default MetricsRibbon;
