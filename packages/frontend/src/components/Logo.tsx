import { cn } from '../lib/utils';

/**
 * DriveSawa brand mark — a dimensional, monochrome "squircle" tile with a
 * road-to-the-horizon glyph (perspective lines receding to a vanishing point:
 * "the road ahead"). Deliberately premium, simple, and not colorful.
 */

const sizes = {
  xs: { tile: 'h-6 w-6', icon: 14, text: 'text-sm', round: 'rounded-[7px]' },
  sm: { tile: 'h-8 w-8', icon: 18, text: 'text-base', round: 'rounded-[9px]' },
  md: { tile: 'h-9 w-9', icon: 20, text: 'text-xl', round: 'rounded-[11px]' },
  lg: { tile: 'h-12 w-12', icon: 26, text: 'text-2xl', round: 'rounded-[14px]' },
} as const;

function RoadGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* road edges converging to a vanishing point */}
      <path d="M5.6 20.2 11 5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M18.4 20.2 13 5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      {/* center lane dashes, shrinking with perspective */}
      <path d="M12 18.4v-2.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 13.6v-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 9.6v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function LogoMark({ size = 'md', invert = false, className }: { size?: keyof typeof sizes; invert?: boolean; className?: string }) {
  const s = sizes[size];
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden',
        s.tile,
        s.round,
        invert
          ? 'bg-white text-zinc-900 ring-1 ring-black/10'
          : 'bg-gradient-to-br from-zinc-700 to-zinc-950 text-white ring-1 ring-white/15 shadow-[0_4px_14px_-3px_rgba(0,0,0,0.45)]',
        className
      )}
    >
      {/* top sheen for a subtle 3D feel */}
      <span className={cn('pointer-events-none absolute inset-x-0 top-0 h-1/2', invert ? '' : 'bg-gradient-to-b from-white/20 to-transparent')} />
      <RoadGlyph size={s.icon} />
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
        <span className={cn('font-extrabold tracking-tight', s.text, invert ? 'text-white' : 'text-zinc-900')}>
          Drive<span className={invert ? 'text-zinc-400' : 'text-zinc-400'}>Sawa</span>
        </span>
      )}
    </span>
  );
}
