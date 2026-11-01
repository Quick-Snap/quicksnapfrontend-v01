'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: 'Do my guests need to download an app from the App Store or Play Store?',
    a: 'No, absolutely not! Roopixo is 100% web-based. Your guests simply scan the QR standee on the table or venue entrance with their default smartphone camera. The event opens instantly in mobile Safari or Chrome with zero app downloads or account friction.',
  },
  {
    q: 'How does AI face matching work? Is biometric data protected?',
    a: 'Guests snap a quick selfie. Our AI generates a secure, one-way mathematical face vector to match photos from the event in under 1 second. Biometric vectors are encrypted, never sold or publicly searchable, and guests only see photos they appear in.',
  },
  {
    q: 'Can photographers protect client photos with custom studio watermarks?',
    a: 'Yes! Photographers on Studio Pro and Enterprise can upload their studio PNG logo or custom text, adjust opacity, position, and size, and automatically protect web preview downloads while keeping original high-res RAW files safe on their local drives.',
  },
  {
    q: 'How long do event galleries remain live for guests to download?',
    a: 'Depending on your plan or pass, galleries stay live online from 6 months (Starter Pro & Single Event Pass) up to 1.5+ years (Enterprise). Guests can revisit the link anytime, search their photos, and download original high-resolution pictures.',
  },
  {
    q: 'How does the big-screen Live Photo Wall work at wedding receptions and parties?',
    a: 'Simply connect any laptop or venue projector to Roopixo’s Live Wall link. As the photographer uploads camera shots or guests contribute live candids, a real-time slideshow broadcasts on stage with an embedded event QR code for maximum crowd engagement.',
  },
  {
    q: 'Can I purchase Roopixo for a single wedding or private birthday party?',
    a: 'Yes! You don’t need to be a professional photographer or commit to a monthly subscription. We offer one-time Retail Event Passes (starting at ₹799) with zero recurring charges, perfect for couples, families, and private hosts.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="landing-faq" className="relative scroll-mt-20 py-24 md:py-32 px-4 sm:px-6 bg-[#06010f] border-t border-white/[0.06] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-white mb-5">
            Got Questions? We’ve Got <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">Answers</span>
          </h2>
          <p className="text-white/60 max-w-xl mx-auto text-base sm:text-lg font-light leading-relaxed">
            Everything you need to know about hosting events, guest privacy, studio tools, and one-time passes.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="space-y-3.5"
        >
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-white/20"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-base sm:text-lg font-medium text-white/90">
                    {faq.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-violet-500/20 border-violet-500/40 text-violet-300' : 'text-white/60'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm sm:text-base font-light text-white/65 leading-relaxed border-t border-white/[0.04] pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default FAQSection;
