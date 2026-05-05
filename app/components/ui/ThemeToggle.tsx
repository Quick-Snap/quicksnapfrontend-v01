'use client';

import { Moon, Sun } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Show “Light” / “Dark” label (e.g. on Settings). Navbar uses compact switch only. */
  showLabel?: boolean;
  /** `sm` = compact fixed; `navbar` = compact on mobile, default from md up */
  size?: 'default' | 'sm' | 'navbar';
};

export function ThemeToggle({ className, showLabel, size = 'default' }: Props) {
  const theme = useAppStore((s) => s.ui.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const isDark = theme === 'dark';
  const sm = size === 'sm';
  const navbar = size === 'navbar';

  const track = (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-200',
        'bg-zinc-200/90 dark:bg-zinc-950/80',
        navbar && 'h-6 w-[2.35rem] md:h-8 md:w-[3.25rem]',
        sm && 'h-6 w-[2.35rem]',
        !navbar && !sm && 'h-8 w-[3.25rem]'
      )}
    >
      <span
        className={cn(
          'absolute left-0.5 top-0.5 flex items-center justify-center rounded-full shadow-md transition-transform duration-200 ease-out',
          'bg-white text-amber-500 ring-1 ring-black/[0.06]',
          'dark:bg-zinc-800 dark:text-amber-300 dark:ring-white/10',
          navbar &&
            (isDark ? 'translate-x-[0.85rem] md:translate-x-[1.375rem]' : 'translate-x-0'),
          sm && !navbar && (isDark ? 'translate-x-[0.85rem]' : 'translate-x-0'),
          !navbar && !sm && (isDark ? 'translate-x-[1.375rem]' : 'translate-x-0'),
          navbar && 'h-5 w-5 md:h-7 md:w-7',
          sm && !navbar && 'h-5 w-5',
          !navbar && !sm && 'h-7 w-7'
        )}
      >
        <Sun
          className={cn(
            'dark:hidden',
            navbar && 'h-3 w-3 md:h-3.5 md:w-3.5',
            sm && !navbar && 'h-3 w-3',
            !navbar && !sm && 'h-3.5 w-3.5'
          )}
          aria-hidden
        />
        <Moon
          className={cn(
            'hidden dark:inline',
            navbar && 'h-3 w-3 md:h-3.5 md:w-3.5',
            sm && !navbar && 'h-3 w-3',
            !navbar && !sm && 'h-3.5 w-3.5'
          )}
          aria-hidden
        />
      </span>
    </span>
  );

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border transition-colors duration-200',
        showLabel ? 'h-10 px-2 py-1' : navbar ? 'h-7 justify-center px-1 py-0.5 md:h-9 md:px-1.5 md:py-1' : sm ? 'h-7 justify-center px-1 py-0.5' : 'h-9 justify-center px-1.5 py-1',
        'border-zinc-200/90 bg-white shadow-sm',
        'hover:border-violet-300/60 hover:bg-zinc-50',
        'dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none',
        'dark:hover:border-white/15 dark:hover:bg-white/[0.1]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500',
        className
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      {showLabel && (
        <span
          className={cn(
            'select-none pl-1 text-xs font-medium tracking-wide',
            'text-zinc-600 dark:text-zinc-400'
          )}
        >
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
      {track}
    </button>
  );
}
