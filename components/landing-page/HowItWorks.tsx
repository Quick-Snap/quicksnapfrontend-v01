'use client';

import { motion } from 'framer-motion';

const steps = [
  { 
    step: "01", 
    title: "Scan QR Code", 
    description: "Find the QuickSnap QR code at your event and scan it with your phone." 
  },
  { 
    step: "02", 
    title: "Take a Selfie", 
    description: "Our AI will use your selfie to find all photos you appear in." 
  },
  { 
    step: "03", 
    title: "Get Your Photos", 
    description: "Instantly access and download all your event photos." 
  }
];

export interface HowItWorksProps {
  customSteps?: typeof steps;
}

export function HowItWorks({ customSteps }: HowItWorksProps) {
  const displaySteps = customSteps || steps;
  
  return (
    <section className="relative py-32 px-6 bg-[#0a0a0a]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="mb-6 h-px w-16 bg-violet-400/50 mx-auto" />
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-white mb-6">
            How It Works
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg font-light leading-relaxed">
            Three simple steps to access all your event photos instantly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displaySteps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="relative p-8 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <span className="text-5xl font-extralight text-violet-500/20 absolute top-4 right-6">
                {item.step}
              </span>
              <h3 className="text-lg font-medium tracking-wide text-white mb-4 mt-8">
                {item.title}
              </h3>
              <p className="text-white/50 text-sm leading-relaxed font-light">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;

