import { cn } from '../lib/utils';

/**
 * Mumotor brand mark — a restrained monogram lettermark: a clean geometric "M"
 * set in a flat ink (near-black navy) squircle. No object/illustration, no
 * gradient, no sheen — a serious, calm corporate mark in the spirit of big-tech
 * B2B logos. Pairs with the lowercase "mumotor" wordmark. Rendered as inline SVG
 * so it stays crisp at any size and adapts to light or dark surfaces via `invert`.
 */

const sizes = {
  xs: { tile: 'h-7 w-7', text: 'text-sm' },
  sm: { tile: 'h-9 w-9', text: 'text-lg' },
  md: { tile: 'h-10 w-10', text: 'text-xl' },
  lg: { tile: 'h-14 w-14', text: 'text-2xl' },
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
  // normal: ink tile + white M · invert (on dark surfaces): white tile + ink M
  const tile = invert ? '#FFFFFF' : '#0F172A';
  const stroke = invert ? '#0F172A' : '#FFFFFF';
  return (
    <span className={cn('inline-flex shrink-0', s.tile, className)}>
      <svg viewBox="0 0 48 48" fill="none" className="h-full w-full" aria-hidden="true">
        <rect width="48" height="48" rx="12" fill={tile} />
        {/* geometric monogram M */}
        <path
          d="M14 34 V16 L24 27 L34 16 V34"
          stroke={stroke}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
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
  const s = sizes[size];
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} invert={invert} />
      {!markOnly && (
        <span
          className={cn(
            'font-sans font-bold tracking-tightest lowercase',
            s.text,
            invert ? 'text-white' : 'text-sand-900'
          )}
        >
          mumotor
        </span>
      )}
    </span>
  );
}
