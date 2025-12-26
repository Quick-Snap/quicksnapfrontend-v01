'use client';

import { motion } from 'framer-motion';
import { FeaturesGrid } from './FeaturesGrid';

export function FeaturesSection() {
  return (
    <section className="relative py-24 md:py-32 px-6 bg-[#0a0a0a]">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-900/5 to-transparent pointer-events-none" />
      
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
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-violet-400/50" />
            <span className="text-xs font-medium tracking-[0.2em] text-violet-400 uppercase">Features</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-violet-400/50" />
          </div>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-white mb-6">
            Why Choose <span className="text-violet-400">QuickSnap</span>?
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed">
            We solve the two biggest pain points in event photography: slow delivery and missed sharing opportunities.
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

