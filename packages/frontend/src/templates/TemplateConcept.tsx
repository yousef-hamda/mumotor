/**
 * TemplateConcept — a small, bespoke ANIMATED preview that expresses each
 * template's actual aesthetic (palette + glass style + motion signature), used
 * on the gallery + builder cards instead of an unrelated driving photo.
 *
 * Every preview is a tiny "website hero": a signature background + a mini content
 * panel (title bar · two text lines · a small accent button) — so it reads like a
 * real site, never an empty box. Pure CSS (cheap, reduced-motion safe). Fills its
 * (relatively-positioned) parent.
 */
import type { CSSProperties } from 'react';
import type { TemplateMeta } from './registry';
import './TemplateConcept.css';

type Vars = CSSProperties & Record<string, string>;

/** Mini hero content (title bar, two lines, a button) for the "card" previews. */
function Lines({ title, line, btn }: { title: string; line: string; btn: string }) {
  return (
    <>
      <span className="tc-l tc-l-title" style={{ background: title, width: '56%' }} />
      <span className="tc-l" style={{ background: line, width: '82%' }} />
      <span className="tc-l" style={{ background: line, width: '50%' }} />
      <span className="tc-btn" style={{ background: btn }} />
    </>
  );
}

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/** Preset accent colours offered on the Mumotor template card (Apple-system). */
export const MUMOTOR_ACCENTS = ['#0071E3', '#5E5CE6', '#AF52DE', '#30B0C7', '#34C759', '#FF9500', '#FF2D55', '#64748B'];

/** Bottom-right colour dots on the Mumotor card — recolours the site's main accent. */
export function MumotorAccentDots({ value, onPick }: { value: string; onPick: (hex: string) => void }) {
  return (
    <div className="tc-dots" role="group" aria-label="Accent colour">
      {MUMOTOR_ACCENTS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Accent ${c}`}
          aria-pressed={value.toLowerCase() === c.toLowerCase()}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPick(c); }}
          className={cx('tc-dot-sw', value.toLowerCase() === c.toLowerCase() && 'is-on')}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}

export function TemplateConcept({ meta, accent }: { meta: TemplateMeta; accent?: string }) {
  const [c1, c2, c3] = [meta.swatch[1] ?? meta.accent, meta.swatch[2] ?? meta.accent, meta.swatch[3] ?? meta.accent];
  const vars: Vars = {
    background: meta.bg,
    '--tc-accent': accent ?? meta.accent,
    '--tc-ink': meta.ink,
    '--tc-c1': c1,
    '--tc-c2': c2,
    '--tc-c3': c3,
  };
  return (
    <div className="tc-root" style={vars} aria-hidden="true">
      {render(meta, c1, c2, c3, accent ?? meta.accent)}
    </div>
  );
}

function render(meta: TemplateMeta, c1: string, c2: string, c3: string, accent: string) {
  switch (meta.slug) {
    case 'mumotor':
      return (
        <>
          <div className="tc-mm-grid" />
          <span className="tc-mm-orb tc-mm-orb-1" style={{ background: `radial-gradient(circle, color-mix(in srgb, ${accent} 36%, transparent), transparent 70%)` }} />
          <span className="tc-mm-orb tc-mm-orb-2" style={{ background: `radial-gradient(circle, color-mix(in srgb, ${accent} 24%, transparent), transparent 70%)` }} />
          <div className="tc-card tc-card--solid tc-mm-card" style={{ borderRadius: 18 }}>
            <span className="tc-mm-logo" style={{ background: accent }} />
            <span className="tc-l tc-l-title" style={{ background: '#1D1D1F', width: '54%' }} />
            <span className="tc-l" style={{ background: 'rgba(29,29,31,0.16)', width: '78%' }} />
            <span className="tc-btn" style={{ background: accent }} />
          </div>
        </>
      );
    case 'meridian':
      return (
        <>
          <div className="tc-mr-contours" />
          <span className="tc-mr-neat" />
          <svg className="tc-mr-route" viewBox="0 0 100 60" preserveAspectRatio="none" fill="none">
            <path d="M6 54 C 26 46, 20 26, 42 20 S 74 16, 94 4" stroke={c1} strokeWidth="1.4" pathLength={1} />
            <circle cx="42" cy="20" r="2.4" fill={meta.bg} stroke={c1} strokeWidth="1" />
          </svg>
          <div className="tc-card tc-card--plate tc-mr-card">
            <Lines title="#1A1F1D" line="rgba(26,31,29,0.20)" btn={c1} />
          </div>
        </>
      );
    case 'bezel':
      return (
        <>
          <div className="tc-bz-knurl" />
          <div className="tc-bz-dial">
            <span className="tc-bz-ticks" />
            <span className="tc-bz-needle" style={{ background: c1 }} />
            <span className="tc-bz-cap" style={{ background: c2 }} />
          </div>
          <div className="tc-card tc-card--face tc-bz-card">
            <Lines title="#EDEBE6" line="rgba(237,235,230,0.20)" btn={c1} />
          </div>
        </>
      );
    case 'solari':
      return (
        <>
          <span className="tc-sl-frame" />
          <div className="tc-card tc-card--flap tc-sl-card">
            <div className="tc-sl-row" aria-hidden="true">
              {['B', 'O', 'O', 'K'].map((ch, i) => (
                <span key={i} className={cx('tc-sl-flap', i % 2 === 0 && 'is-flip')} style={{ color: c1, animationDelay: `${i * 0.14}s` }}>{ch}</span>
              ))}
            </div>
            <span className="tc-l" style={{ background: 'rgba(237,231,216,0.26)', width: '72%' }} />
            <span className="tc-btn" style={{ background: c1 }} />
          </div>
        </>
      );
    case 'cadence':
      return (
        <>
          <span className="tc-cd-ghost" aria-hidden="true" style={{ color: c3 }}>Aa</span>
          <span className="tc-cd-word" aria-hidden="true" style={{ color: accent }}>DRIVE</span>
          <span className="tc-cd-marquee" style={{ background: accent }} />
          <div className="tc-card tc-card--paper tc-cd-card">
            <Lines title="#141318" line="rgba(20,19,24,0.22)" btn={accent} />
          </div>
        </>
      );
    case 'circuit':
      return (
        <>
          <span className="tc-ci-weave" />
          <svg className="tc-ci-track" viewBox="0 0 100 60" fill="none" aria-hidden="true">
            <path d="M18 46 C 6 40, 8 20, 26 16 S 60 22, 74 14 S 96 20, 88 36 S 60 52, 40 48 S 26 52, 18 46 Z" stroke={c3} strokeWidth="4" strokeLinejoin="round" />
            <path className="tc-ci-line" d="M18 46 C 6 40, 8 20, 26 16 S 60 22, 74 14 S 96 20, 88 36 S 60 52, 40 48 S 26 52, 18 46 Z" stroke={c1} strokeWidth="1" />
            <circle className="tc-ci-car" r="2.4" fill={c1} />
          </svg>
          <div className="tc-card tc-card--carbon tc-ci-card">
            <span className="tc-ci-live"><span className="tc-ci-dot" style={{ background: c2 }} /></span>
            <Lines title="#EDF1F5" line="rgba(237,241,245,0.24)" btn={c1} />
          </div>
        </>
      );
    case 'press':
      return (
        <>
          <span className="tc-ps-grain" />
          <span className="tc-ps-word" aria-hidden="true" style={{ color: meta.ink }}>ABC</span>
          <span className="tc-ps-seal" style={{ background: `radial-gradient(circle at 38% 34%, ${c2}, color-mix(in srgb, ${c2} 55%, #000) 90%)` }} />
          <div className="tc-card tc-card--paperpress tc-ps-card">
            <Lines title="#1B1A18" line="rgba(27,26,24,0.2)" btn={accent} />
          </div>
        </>
      );
    case 'reel':
      return (
        <>
          <span className="tc-rl-bar tc-rl-bar-top" />
          <span className="tc-rl-bar tc-rl-bar-bot" />
          <div className="tc-rl-strip" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => <span key={i} className="tc-rl-frame" style={{ background: c3 }} />)}
          </div>
          <div className="tc-card tc-card--matte tc-rl-card">
            <Lines title="#F4F1EA" line="rgba(244,241,234,0.24)" btn={c1} />
          </div>
        </>
      );
    case 'slate':
      return (
        <>
          <span className="tc-st-grain" />
          <svg className="tc-st-draw" viewBox="0 0 100 60" fill="none" aria-hidden="true">
            <circle className="tc-st-p" cx="74" cy="30" r="15" stroke={c1} strokeWidth="1.5" pathLength={1} />
            <path className="tc-st-p" d="M56 30 H92 M74 12 V48" stroke={c2} strokeWidth="1.2" pathLength={1} />
          </svg>
          <div className="tc-card tc-card--chalk tc-st-card">
            <Lines title="#EDEAE0" line="rgba(237,234,224,0.30)" btn={c1} />
          </div>
        </>
      );
    case 'primary':
      return (
        <>
          <span className="tc-pm-shape tc-pm-circle" style={{ background: c1 }} />
          <span className="tc-pm-shape tc-pm-tri" style={{ borderBottomColor: c2 }} />
          <span className="tc-pm-shape tc-pm-sq" style={{ background: c3 }} />
          <span className="tc-pm-shape tc-pm-bar" style={{ background: meta.ink }} />
          <div className="tc-card tc-card--paperpm tc-pm-card">
            <Lines title="#161514" line="rgba(22,21,20,0.2)" btn={c1} />
          </div>
        </>
      );
    case 'gallery':
      return (
        <>
          <span className="tc-ga-spot" />
          <div className="tc-ga-frame"><span className="tc-ga-art" style={{ background: `linear-gradient(150deg, ${c2}, color-mix(in srgb, ${c2} 60%, #000))` }} /></div>
          <span className="tc-ga-plate"><span className="tc-l" style={{ background: c1, width: '60%', height: 5 }} /><span className="tc-l" style={{ background: 'rgba(28,26,23,0.3)', width: '80%', height: 4 }} /></span>
        </>
      );
    case 'gilt':
      return (
        <>
          <span className="tc-gt-seal" style={{ background: `radial-gradient(circle at 38% 34%, ${c1}, ${c2} 90%)` }} />
          <div className="tc-card tc-card--charcoalgt tc-gt-card">
            <span className="tc-gt-foil" aria-hidden="true" style={{ backgroundImage: `linear-gradient(110deg, ${c2}, ${c1}, #F4E9C8, ${c1}, ${c2})` }}>GILT</span>
            <span className="tc-l" style={{ background: 'rgba(239,233,221,0.24)', width: '72%' }} />
            <span className="tc-btn" style={{ background: c1 }} />
          </div>
        </>
      );
    case 'sumi':
      return (
        <>
          <span className="tc-su-grain" />
          <span className="tc-su-wash" style={{ background: c2 }} />
          <svg className="tc-su-enso" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <path className="tc-su-p" d="M62 22 A32 32 0 1 0 78 40" stroke={meta.ink} strokeWidth="6" strokeLinecap="round" pathLength={1} />
          </svg>
          <span className="tc-su-seal" style={{ background: c1 }} aria-hidden="true">木</span>
          <div className="tc-card tc-card--washi tc-su-card">
            <Lines title="#1A1815" line="rgba(26,24,21,0.2)" btn={c1} />
          </div>
        </>
      );
    case 'atelier':
      return (
        <>
          <span className="tc-at-tape" style={{ background: c3 }} />
          <svg className="tc-at-seam" viewBox="0 0 100 60" fill="none" aria-hidden="true">
            <path className="tc-at-p" d="M91 4 V56" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeDasharray="3.4 3.4" pathLength={1} />
          </svg>
          <div className="tc-card tc-card--paperat tc-at-card">
            <span className="tc-at-swatch" style={{ background: accent }} />
            <Lines title="#241F1B" line="rgba(36,31,27,0.18)" btn={accent} />
          </div>
        </>
      );
    case 'nocturne':
      return (
        <>
          <span className="tc-nc-stars" />
          <svg className="tc-nc-course" viewBox="0 0 100 60" fill="none" aria-hidden="true">
            <path className="tc-nc-p" d="M8 48 L30 31 L52 38 L74 15 L94 22" stroke={accent} strokeWidth="1" pathLength={1} />
            {[[8, 48], [30, 31], [52, 38], [74, 15], [94, 22]].map(([x, y], i) => (
              <circle key={i} className="tc-nc-star" cx={x} cy={y} r="1.7" fill={accent} style={{ animationDelay: `${i * 0.5}s` }} />
            ))}
          </svg>
          <div className="tc-card tc-card--nocturne tc-nc-card" style={{ background: c2 }}>
            <Lines title="#F4F1E8" line="rgba(244,241,232,0.24)" btn={accent} />
          </div>
        </>
      );
    case 'deco':
      return (
        <>
          <span className="tc-dc-fan" style={{ background: `repeating-conic-gradient(from 200deg at 50% 100%, ${c1} 0deg 3deg, transparent 3deg 9deg)` }} />
          <svg className="tc-dc-dial" viewBox="0 0 100 40" fill="none" aria-hidden="true">
            <path d="M14 36 A36 36 0 0 1 86 36" stroke={c1} strokeWidth="1.4" />
            <line className="tc-dc-hand" x1="50" y1="36" x2="50" y2="8" stroke={c2} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <div className="tc-card tc-card--paperdc tc-dc-card">
            <Lines title="#1C1B17" line="rgba(28,27,23,0.18)" btn={c2} />
          </div>
        </>
      );
    case 'grid-ink':
      return (
        <>
          <div className="tc-lines" />
          <span className="tc-dot" style={{ background: meta.accent }} />
        </>
      );
    case 'open-road':
      return (
        <>
          <span className="tc-sun" />
          <span className="tc-road" />
        </>
      );
    default:
      return <div className="tc-layer" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, opacity: 0.6 }} />;
  }
}
