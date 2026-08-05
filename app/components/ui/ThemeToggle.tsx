'use client';

import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Show “Light” / “Dark” label (e.g. on Settings). Navbar uses icon only. */
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

  const toggler = (
    <AnimatedThemeToggler
      theme={theme}
      onThemeChange={setTheme}
      duration={400}
      variant="circle"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border transition-colors duration-200',
        'border-zinc-200/90 bg-white text-zinc-700 shadow-sm',
        'hover:border-violet-300/60 hover:bg-zinc-50 hover:text-zinc-900',
        'dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-200 dark:shadow-none',
        'dark:hover:border-white/15 dark:hover:bg-white/[0.1] dark:hover:text-white',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500',
        navbar && 'h-7 w-7 md:h-9 md:w-9',
        sm && !navbar && 'h-7 w-7',
        !navbar && !sm && 'h-9 w-9',
        navbar && '[&_svg]:h-3.5 [&_svg]:w-3.5 md:[&_svg]:h-4 md:[&_svg]:w-4',
        sm && !navbar && '[&_svg]:h-3.5 [&_svg]:w-3.5',
        !navbar && !sm && '[&_svg]:h-4 [&_svg]:w-4',
        !showLabel && className
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    />
  );

  if (!showLabel) {
    return toggler;
  }

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'select-none text-xs font-medium tracking-wide',
          'text-zinc-600 dark:text-zinc-400'
        )}
      >
        {isDark ? 'Dark' : 'Light'}
      </span>
      {toggler}
    </div>
  );
}
