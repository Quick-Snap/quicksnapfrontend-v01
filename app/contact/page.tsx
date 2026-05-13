import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Linkedin, Instagram, Twitter, MapPin, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the QuickSnap team. We help event organizers and photographers deliver photos instantly with AI.',
};

const CONTACT_EMAIL = 'contact@quicksnap.online';

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-white text-zinc-900 dark:bg-[#0a0a0a] dark:text-white font-sans">
      <main className="pt-20 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-16">
            <div className="mb-8 h-px w-16 bg-violet-500/60 dark:bg-violet-400/50 mx-auto" />
            <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
              Get in Touch
            </h1>
            <p className="text-zinc-600 dark:text-white/50 max-w-xl mx-auto text-lg font-light leading-relaxed">
              Have a question, partnership idea, or need help with your event?
              We&apos;d love to hear from you.
            </p>
          </div>

          {/* Primary Email Card */}
          <div className="relative overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] p-8 md:p-12 mb-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-200/60 via-transparent to-transparent dark:from-violet-900/20 dark:via-transparent dark:to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
              <div className="flex items-center justify-center w-14 h-14 border border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-white/50 mb-2">
                  Email us
                </p>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-2xl md:text-3xl font-light tracking-tight text-zinc-900 hover:text-violet-700 dark:text-white dark:hover:text-violet-300 transition-colors break-all"
                >
                  {CONTACT_EMAIL}
                </a>
                <p className="text-sm font-light text-zinc-500 dark:text-white/40 mt-3">
                  We typically reply within 24 hours on business days.
                </p>
              </div>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium tracking-wider transition-all border border-violet-500"
              >
                Send Email
              </a>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] p-8">
              <div className="flex items-center justify-center w-10 h-10 border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-zinc-700 dark:text-white/70 mb-5">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-light tracking-tight text-zinc-900 dark:text-white mb-2">
                Support Hours
              </h3>
              <p className="text-sm font-light text-zinc-600 dark:text-white/50 leading-relaxed">
                Monday – Saturday
                <br />
                10:00 AM – 7:00 PM IST
              </p>
            </div>

            <div className="border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] p-8">
              <div className="flex items-center justify-center w-10 h-10 border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-zinc-700 dark:text-white/70 mb-5">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-light tracking-tight text-zinc-900 dark:text-white mb-2">
                Based in
              </h3>
              <p className="text-sm font-light text-zinc-600 dark:text-white/50 leading-relaxed">
                India
                <br />
                Serving events worldwide.
              </p>
            </div>
          </div>

          {/* Audience Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] p-6">
              <p className="text-xs font-medium uppercase tracking-widest text-violet-700 dark:text-violet-300/80 mb-3">
                Organizers
              </p>
              <p className="text-sm font-light text-zinc-600 dark:text-white/60 leading-relaxed">
                Planning a wedding, conference, or festival? Let&apos;s talk
                about delivering photos to your guests instantly.
              </p>
            </div>
            <div className="border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] p-6">
              <p className="text-xs font-medium uppercase tracking-widest text-violet-700 dark:text-violet-300/80 mb-3">
                Photographers
              </p>
              <p className="text-sm font-light text-zinc-600 dark:text-white/60 leading-relaxed">
                Want to streamline your delivery and impress clients? We&apos;d
                love to onboard you to QuickSnap.
              </p>
            </div>
            <div className="border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] p-6">
              <p className="text-xs font-medium uppercase tracking-widest text-violet-700 dark:text-violet-300/80 mb-3">
                Partnerships
              </p>
              <p className="text-sm font-light text-zinc-600 dark:text-white/60 leading-relaxed">
                Press, integrations, or collaborations — drop us a note and our
                team will get back to you.
              </p>
            </div>
          </div>

          {/* Socials */}
          <div className="border-t border-zinc-200 dark:border-white/5 pt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-sm font-medium uppercase tracking-widest text-zinc-700 dark:text-white/60 mb-3">
                Follow Us
              </h3>
              <div className="flex items-center gap-4">
                <a
                  href="https://www.linkedin.com/company/quicksnap-online"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="flex items-center justify-center w-10 h-10 border border-zinc-200 text-zinc-500 hover:text-violet-700 hover:border-violet-500/40 dark:border-white/10 dark:text-white/50 dark:hover:text-violet-400 dark:hover:border-violet-500/40 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://www.instagram.com/quicksnap.online"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex items-center justify-center w-10 h-10 border border-zinc-200 text-zinc-500 hover:text-violet-700 hover:border-violet-500/40 dark:border-white/10 dark:text-white/50 dark:hover:text-violet-400 dark:hover:border-violet-500/40 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://x.com/QuickSnapOnline"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X"
                  className="flex items-center justify-center w-10 h-10 border border-zinc-200 text-zinc-500 hover:text-violet-700 hover:border-violet-500/40 dark:border-white/10 dark:text-white/50 dark:hover:text-violet-400 dark:hover:border-violet-500/40 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </div>
            <Link
              href="/"
              className="text-sm font-light tracking-wider text-zinc-500 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
