import { cn } from '../lib/utils';

/**
 * Mumotor brand logo — the road-themed mark (a rounded "M" with lane-marking dots
 * + speed lines) and the "Mumotor" wordmark on a dotted-road underline. Served as
 * transparent PNGs (public/img/logo-*.png). `LogoMark` = the M in a white squircle
 * tile (for compact / paired-with-name spots); `Logo` = the full wordmark. `invert`
 * swaps to the white variant for dark surfaces.
 */

const sizes = {
  xs: { tile: 'h-7 w-7', word: 'h-5' },
  sm: { tile: 'h-9 w-9', word: 'h-6' },
  md: { tile: 'h-10 w-10', word: 'h-7' },
  lg: { tile: 'h-14 w-14', word: 'h-9' },
} as const;

export function LogoMark({
  size = 'md',
  invert = false,
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
  invert?: boolean;
}) {
  const s = sizes[size];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl border bg-white',
        invert ? 'border-white/20' : 'border-sand-200',
        s.tile,
        className
      )}
    >
      <img src="/img/logo-m.png" alt="" aria-hidden className="h-[62%] w-[62%] object-contain" />
    </span>
  );
}

export function Logo({
  size = 'md',
  markOnly = false,
  invert = false,
  className,
}: {
  size?: keyof typeof sizes;
  markOnly?: boolean;
  invert?: boolean;
  className?: string;
}) {
  if (markOnly) return <LogoMark size={size} invert={invert} className={className} />;
  const s = sizes[size];
  return (
    <img
      src={invert ? '/img/logo-wordmark-white.png' : '/img/logo-wordmark.png'}
      alt="Mumotor"
      className={cn('w-auto object-contain', s.word, className)}
    />
  );
}
