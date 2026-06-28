import type { CSSProperties } from 'react';

/**
 * Mumotor's signature default logo: the brand's first initial set inside a
 * squircle tile with a thin inset ring — a quiet nod to a steering wheel / the
 * open road. Each template themes it via `bg`/`fg`/`radius` so it feels native,
 * yet the silhouette stays recognisably "ours". If the user uploaded a real
 * logo (`src`), that image is shown instead.
 */
export function BrandMark({
  letter,
  src,
  size = 36,
  bg,
  fg,
  radius = '30%',
  ring = true,
  square = false,
  className,
  style,
}: {
  letter: string;
  src?: string;
  size?: number;
  bg: string;
  fg: string;
  /** Tile corner radius (squircle). Ignored when `square`. */
  radius?: number | string;
  /** Show the inset wheel-hub ring. */
  ring?: boolean;
  /** Hard-edged variant (brutalist) — zero radius. */
  square?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const r = square ? 0 : radius;

  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, borderRadius: r, objectFit: 'cover', display: 'block', ...style }}
      />
    );
  }

  const initial = (letter || 'M').trim().charAt(0).toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        position: 'relative',
        display: 'inline-grid',
        placeItems: 'center',
        width: size,
        height: size,
        background: bg,
        color: fg,
        borderRadius: r,
        flexShrink: 0,
        ...style,
      }}
    >
      {ring && (
        <span
          style={{
            position: 'absolute',
            inset: Math.round(size * 0.17),
            border: `${Math.max(1.5, size * 0.045)}px solid ${fg}`,
            opacity: 0.26,
            borderRadius: '50%',
          }}
        />
      )}
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          fontWeight: 800,
          fontSize: Math.round(size * 0.46),
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {initial}
      </span>
    </span>
  );
}
