import Link from 'next/link';
import { cn } from '@/lib/utils';

export type BrandLogoProps = {
  href?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Prefer white text on dark surfaces; default adapts to light/dark theme. */
  tone?: 'auto' | 'light' | 'dark';
  className?: string;
  showMark?: boolean;
};

const sizeStyles = {
  sm: {
    mark: 'h-6 w-6 text-[11px]',
    word: 'text-base',
  },
  md: {
    mark: 'h-8 w-8 text-sm',
    word: 'text-xl',
  },
  lg: {
    mark: 'h-10 w-10 text-base',
    word: 'text-2xl',
  },
  xl: {
    mark: 'h-12 w-12 text-lg',
    word: 'text-3xl',
  },
} as const;

const toneWord = {
  auto: 'text-zinc-900 dark:text-white',
  light: 'text-white',
  dark: 'text-zinc-900',
} as const;

/**
 * Modern text wordmark for Roopixo — geometric "R" mark + Syne display type.
 */
export function BrandLogo({
  href = '/',
  size = 'md',
  tone = 'auto',
  className,
  showMark = true,
}: BrandLogoProps) {
  const styles = sizeStyles[size];

  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {showMark && (
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-[0.35rem] bg-gradient-to-br from-violet-500 to-fuchsia-600 font-display font-extrabold text-white shadow-[0_0_24px_-6px_rgba(139,92,246,0.65)]',
            styles.mark
          )}
          aria-hidden
        >
          R
        </span>
      )}
      <span
        className={cn(
          'font-display font-extrabold tracking-[-0.045em] leading-none',
          styles.word,
          toneWord[tone]
        )}
      >
        Roo
        <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          pixo
        </span>
      </span>
    </span>
  );

  if (href === null) {
    return content;
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-sm"
      aria-label="Roopixo home"
    >
      {content}
    </Link>
  );
}

export default BrandLogo;
