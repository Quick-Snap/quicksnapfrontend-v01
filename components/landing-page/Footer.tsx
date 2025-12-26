'use client';

export interface FooterProps {
  brandName?: string;
  year?: number;
}

export function Footer({ 
  brandName = 'QUICKSNAP',
  year = new Date().getFullYear()
}: FooterProps) {
  return (
    <footer className="py-12 px-6 border-t border-white/5 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-sm flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-sm font-light tracking-[0.1em] text-white/50">{brandName}</span>
        </div>
        <p className="text-xs font-light tracking-wider text-white/30">
          © {year} {brandName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;

