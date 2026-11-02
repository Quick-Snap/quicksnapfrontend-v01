'use client';

import { motion } from 'framer-motion';
import { FeaturesGrid } from './FeaturesGrid';

export function FeaturesSection() {
  return (
    <section
      id="landing-features"
      className="relative scroll-mt-20 py-24 md:py-32 px-6 bg-white dark:bg-[#0a0a0a] transition-colors duration-200"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 dark:from-violet-900/5 to-transparent pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-violet-500/50" />
            <span className="text-xs font-semibold tracking-[0.2em] text-violet-600 dark:text-violet-400 uppercase">Features</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-violet-500/50" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-[-0.03em] text-zinc-900 dark:text-white mb-5">
            Everything You Need for <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 dark:from-violet-400 dark:via-fuchsia-300 dark:to-indigo-300 bg-clip-text text-transparent">Flawless Events</span>
          </h2>
          <p className="text-zinc-600 dark:text-white/55 max-w-2xl mx-auto text-base md:text-lg font-normal dark:font-light leading-relaxed">
            Engineered for high-volume photographers, wedding planners, and unforgettable celebrations. From live wall projection to sub-second face matching.
          </p>
        </motion.div>

        {/* Glowing Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <FeaturesGrid />
        </motion.div>
      </div>
    </section>
  );
}

export default FeaturesSection;

