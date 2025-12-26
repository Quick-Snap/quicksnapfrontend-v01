'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export interface CTASectionProps {
  title?: string;
  subtitle?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  signupHref?: string;
  loginHref?: string;
}

export function CTASection({
  title = "Ready to Transform Your Events?",
  subtitle = "Join thousands of event organizers and photographers who trust QuickSnap.",
  primaryButtonText = "Start Free Trial",
  secondaryButtonText = "Contact Sales",
  signupHref = '/register',
  loginHref = '/login'
}: CTASectionProps) {
  return (
    <section className="relative py-32 px-6 bg-[#0a0a0a]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto text-center relative z-10"
      >
        <div className="mb-8 h-px w-16 bg-violet-400/50 mx-auto" />
        <h2 className="text-3xl md:text-5xl font-light tracking-tight text-white mb-6">
          {title}
        </h2>
        <p className="text-white/50 max-w-xl mx-auto text-lg font-light leading-relaxed mb-10">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={signupHref}
            className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium tracking-wider transition-all border border-violet-500"
          >
            {primaryButtonText}
          </Link>
          <Link
            href={loginHref}
            className="px-8 py-4 bg-transparent hover:bg-white/5 text-white text-sm font-medium tracking-wider transition-all border border-white/20"
          >
            {secondaryButtonText}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

export default CTASection;

