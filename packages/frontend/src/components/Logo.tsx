import { cn } from '../lib/utils';

/**
 * Mumotor brand mark — a rising sun over a road that converges at the horizon,
 * set in a warm "sunrise" squircle tile. Rendered as inline SVG so it stays
 * crisp at any size and can sit on light or dark surfaces. Paired with the
 * lowercase "mu·motor" wordmark.
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
      <svg viewBox="0 0 48 48" fill="none" className="h-full w-full drop-shadow-[0_6px_14px_rgba(214,115,10,0.35)]" aria-hidden="true">
        <defs>
          <linearGradient id="mmTile" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FBC74A" />
            <stop offset="0.5" stopColor="#F2940B" />
            <stop offset="1" stopColor="#E54E26" />
          </linearGradient>
          <linearGradient id="mmSun" x1="24" y1="11" x2="24" y2="25" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFDF6" />
            <stop offset="1" stopColor="#FFE9B8" />
          </linearGradient>
          <clipPath id="mmClip">
            <rect width="48" height="48" rx="13" />
          </clipPath>
        </defs>
        <rect width="48" height="48" rx="13" fill="url(#mmTile)" />
        <g clipPath="url(#mmClip)">
          <rect width="48" height="22" fill="#FFFFFF" opacity="0.16" />
          <circle cx="24" cy="19.5" r="6.6" fill="url(#mmSun)" />
          <path d="M14.5 44 L22.4 24.5 H25.6 L33.5 44 Z" fill="#221C15" opacity="0.92" />
          <path d="M24 27 L24 42" stroke="#FBC74A" strokeWidth="1.7" strokeLinecap="round" strokeDasharray="0.2 3.4" />
        </g>
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
          <span className="text-sun-600">motor</span>
        </span>
      )}
    </span>
  );
}
