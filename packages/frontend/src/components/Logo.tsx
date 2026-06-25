import { cn } from '../lib/utils';

/**
 * Mumotor brand mark — a minimal steering wheel (ring + hub + three spokes) set
 * in a dark oxblood-clay squircle tile. The wheel reads instantly as "driving
 * instruction"; the clay tile ties it to the brand palette. Rendered as inline
 * SVG so it stays crisp at any size and sits on light or dark surfaces. Paired
 * with the lowercase "mu·motor" wordmark.
 */

const sizes = {
  xs: { tile: 'h-7 w-7', text: 'text-sm' },
  sm: { tile: 'h-9 w-9', text: 'text-lg' },
  md: { tile: 'h-10 w-10', text: 'text-xl' },
  lg: { tile: 'h-14 w-14', text: 'text-2xl' },
} as const;

export function LogoMark({ size = 'md', className }: { size?: keyof typeof sizes; className?: string; invert?: boolean }) {
  const s = sizes[size];
  return (
    <span className={cn('inline-flex shrink-0', s.tile, className)}>
      <svg viewBox="0 0 48 48" fill="none" className="h-full w-full drop-shadow-[0_6px_14px_rgba(86,31,26,0.4)]" aria-hidden="true">
        <defs>
          <linearGradient id="mmTile" x1="6" y1="3" x2="42" y2="45" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8A4338" />
            <stop offset="0.55" stopColor="#6E3328" />
            <stop offset="1" stopColor="#3A1713" />
          </linearGradient>
          <linearGradient id="mmWheel" x1="24" y1="9" x2="24" y2="41" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FBF3EC" />
            <stop offset="1" stopColor="#E3D3C5" />
          </linearGradient>
        </defs>
        {/* clay tile */}
        <rect width="48" height="48" rx="13" fill="url(#mmTile)" />
        {/* top sheen for depth */}
        <rect width="48" height="22" rx="13" fill="#FFFFFF" opacity="0.07" />
        {/* steering wheel */}
        <g stroke="url(#mmWheel)" strokeWidth="2.9" strokeLinecap="round" fill="none">
          <circle cx="24" cy="25" r="12.4" />
          {/* three spokes from the hub: down, upper-left, upper-right */}
          <path d="M24 25 L24 36.2" />
          <path d="M24 25 L14.7 20.0" />
          <path d="M24 25 L33.3 20.0" />
        </g>
        {/* hub */}
        <circle cx="24" cy="25" r="4.2" fill="url(#mmWheel)" />
        <circle cx="24" cy="25" r="1.7" fill="#6E3328" />
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
      <LogoMark size={size} />
      {!markOnly && (
        <span className={cn('font-sans font-extrabold tracking-tightest lowercase', s.text)}>
          <span className={invert ? 'text-white' : 'text-sand-900'}>mu</span>
          {/* clay accent — lighter on dark, deeper on light, so it always reads */}
          <span className={invert ? 'text-sun-300' : 'text-sun-700'}>motor</span>
        </span>
      )}
    </span>
  );
}
