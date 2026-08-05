'use client';

import { cn } from '@/lib/utils';

const PARTNERS = [
  'GDG Indore',
  'ML Bhopal',
  'ML Delhi',
] as const;

export type TrustRibbonProps = {
  className?: string;
  label?: string;
};

function PartnerChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-3 whitespace-nowrap px-1">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/80" aria-hidden />
      <span className="font-display text-sm font-semibold tracking-[-0.02em] text-white/80 sm:text-base">
        {name}
      </span>
    </span>
  );
}

function PartnerRow({ id }: { id: string }) {
  // Repeat so one row is always wider than the viewport
  const items = [...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS];

  return (
    <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={id === 'b' ? true : undefined}>
      {items.map((name, i) => (
        <PartnerChip key={`${id}-${name}-${i}`} name={name} />
      ))}
    </div>
  );
}

export function TrustRibbon({
  className,
  label = 'Trusted by communities that partner with us',
}: TrustRibbonProps) {
  return (
    <div
      className={cn(
        'w-full overflow-hidden border-y border-white/10 bg-black/40 backdrop-blur-md',
        className
      )}
      role="region"
      aria-label={label}
    >
      <p className="px-6 pt-3 text-center text-[10px] font-medium uppercase tracking-[0.28em] text-white/40 sm:text-[11px]">
        {label}
      </p>

      <div className="relative mt-2 overflow-hidden pb-3">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-12 bg-gradient-to-r from-black/80 to-transparent sm:w-20"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-12 bg-gradient-to-l from-black/80 to-transparent sm:w-20"
          aria-hidden
        />

        {/* Single track = two identical halves; animates by -50% for a seamless loop */}
        <div className="trust-marquee-track flex w-max">
          <PartnerRow id="a" />
          <PartnerRow id="b" />
        </div>
      </div>
    </div>
  );
}

export default TrustRibbon;
