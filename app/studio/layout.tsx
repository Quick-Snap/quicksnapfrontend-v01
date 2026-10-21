'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useEffect, useState } from 'react';
import {
  Camera,
  FolderOpen,
  Upload,
  Settings,
  ArrowLeft,
  Sparkles,
  LogOut,
  Menu,
  X,
  Layers,
  Heart
} from 'lucide-react';
import { ThemeToggle } from '@/app/components/ui/ThemeToggle';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, logout } = useAuth();
  const { role, isPhotographer, isOrganizer, isAdmin } = useRole();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || '/studio')}`);
    }
  }, [user, authLoading, router, pathname]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d13] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-500" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { name: 'Shoots & Proofing', href: '/studio', icon: Layers },
    { name: 'Bulk Upload', href: '/photographer/upload', icon: Upload },
    { name: 'Studio Settings', href: '/studio/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0b0d13] text-zinc-100 flex flex-col font-sans">
      {/* Top Studio Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0e111a]/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white md:hidden hover:bg-white/5"
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href="/studio" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25">
                <Camera className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">Roopixo</span>
                <span className="rounded-md border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-violet-300">
                  Studio
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <ArrowLeft size={14} />
              <span>Exit Studio</span>
            </Link>

            <ThemeToggle />

            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="hidden text-right md:block">
                <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
                <p className="text-[10px] text-violet-400 capitalize">{user.role || 'Photographer'}</p>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Body with Sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-white/[0.08] bg-[#0c0e16]/80 p-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/studio' && pathname?.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm'
                      : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-violet-400' : 'text-zinc-400'} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/[0.06]">
            <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-[#131127] to-[#0c0e16] p-4 text-xs">
              <div className="flex items-center gap-2 text-violet-300 font-semibold mb-1">
                <Sparkles size={14} />
                <span>Lightroom Ready</span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Clients shortlist with ❤️ and 🔖. Export filenames directly into Adobe Lightroom Classic in 1 click.
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Nav Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden" onClick={() => setMobileNavOpen(false)}>
            <div className="w-64 h-full bg-[#0c0e16] p-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <span className="font-bold text-white">Roopixo Studio</span>
                <button type="button" onClick={() => setMobileNavOpen(false)} className="text-zinc-400">
                  <X size={18} />
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                        active ? 'bg-violet-600/20 text-violet-300' : 'text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-auto pt-4 border-t border-white/10">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white py-2"
                >
                  <ArrowLeft size={14} />
                  <span>Exit to Main Site</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Studio Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
