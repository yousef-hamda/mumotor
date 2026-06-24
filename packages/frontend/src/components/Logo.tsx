import { cn } from '../lib/utils';

/**
 * DriveSawa brand mark — a premium 3D steering-wheel emblem (AI-rendered) in a
 * rounded app-icon tile, paired with the wordmark.
 */

const sizes = {
  xs: { tile: 'h-7 w-7', round: 'rounded-lg', text: 'text-sm' },
  sm: { tile: 'h-9 w-9', round: 'rounded-[10px]', text: 'text-base' },
  md: { tile: 'h-10 w-10', round: 'rounded-xl', text: 'text-xl' },
  lg: { tile: 'h-14 w-14', round: 'rounded-2xl', text: 'text-2xl' },
} as const;

const MARK_SRC = '/img/brand-256.png';

export function LogoMark({ size = 'md', className }: { size?: keyof typeof sizes; className?: string; invert?: boolean }) {
  const s = sizes[size];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 overflow-hidden bg-zinc-900 ring-1 ring-black/10 shadow-[0_6px_16px_-6px_rgba(0,0,0,0.4)]',
        s.tile,
        s.round,
        className
      )}
    >
      <img src={MARK_SRC} alt="DriveSawa" className="h-full w-full scale-110 object-cover" loading="eager" />
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
        <span className={cn('font-extrabold tracking-tight', s.text, invert ? 'text-white' : 'text-zinc-900')}>
          Drive<span className={invert ? 'text-zinc-400' : 'text-zinc-400'}>Sawa</span>
        </span>
      )}
    </span>
  );
}
