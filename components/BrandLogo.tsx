import Link from 'next/link';
import { cn } from '@/lib/utils';

export type BrandLogoProps = {
  href?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Prefer white text on dark surfaces; default adapts to light/dark theme. */
  tone?: 'auto' | 'light' | 'dark';
  className?: string;
  showMark?: boolean;
  showText?: boolean;
  /** Layout orientation: text to the right (horizontal) or below (vertical). */
  layout?: 'horizontal' | 'vertical';
};

const sizeStyles = {
  xs: {
    mark: 'h-5 w-auto',
    word: 'text-sm',
    gap: 'gap-2',
  },
  sm: {
    mark: 'h-6 w-auto sm:h-7',
    word: 'text-base sm:text-lg',
    gap: 'gap-2.5',
  },
  md: {
    mark: 'h-8 w-auto sm:h-9',
    word: 'text-xl sm:text-2xl',
    gap: 'gap-3',
  },
  lg: {
    mark: 'h-10 w-auto sm:h-12',
    word: 'text-2xl sm:text-3xl',
    gap: 'gap-3.5',
  },
  xl: {
    mark: 'h-14 w-auto sm:h-16',
    word: 'text-3xl sm:text-4xl',
    gap: 'gap-4',
  },
} as const;

const toneWord = {
  auto: 'text-zinc-900 dark:text-white',
  light: 'text-white',
  dark: 'text-zinc-900',
} as const;

/**
 * Official BrandLogo for Roopixo — Infinity Lens logomark + Syne display wordmark.
 */
export function BrandLogo({
  href = '/',
  size = 'md',
  tone = 'auto',
  className,
  showMark = true,
  showText = true,
  layout = 'horizontal',
}: BrandLogoProps) {
  const styles = sizeStyles[size] || sizeStyles.md;

  const content = (
    <span
      className={cn(
        'inline-flex items-center',
        layout === 'vertical' ? 'flex-col justify-center text-center' : 'flex-row',
        styles.gap,
        className
      )}
    >
      {showMark && (
        <span className="relative inline-flex shrink-0 items-center justify-center">
          <img
            src="/logo-mark.png"
            alt="Roopixo"
            className={cn('object-contain select-none transition-transform hover:scale-105', styles.mark)}
            loading="eager"
            decoding="async"
          />
        </span>
      )}
      {showText && (
        <span
          className={cn(
            'font-display font-extrabold tracking-[-0.04em] leading-none select-none',
            styles.word,
            toneWord[tone]
          )}
        >
          Roo
          <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
            pixo
          </span>
        </span>
      )}
    </span>
  );

  if (href === null) {
    return content;
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-lg"
      aria-label="Roopixo home"
    >
      {content}
    </Link>
  );
}

export default BrandLogo;
