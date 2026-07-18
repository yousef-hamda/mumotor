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
    case 'console':
      return (
        <>
          <span className="tc-co-grid" />
          <svg className="tc-co-spark" viewBox="0 0 100 34" fill="none" aria-hidden="true">
            <path className="tc-co-p" d="M3 26 L18 20 L33 23 L48 11 L63 15 L78 6 L97 10" stroke={accent} strokeWidth="1.6" strokeLinecap="round" pathLength={1} />
          </svg>
          <div className="tc-card tc-card--console tc-co-card">
            <span className="tc-co-cmd">
              <span className="tc-co-key" style={{ borderColor: c3 }}>⌘K</span>
              <span className="tc-co-caret" style={{ background: accent }} />
            </span>
            <span className="tc-l tc-l-title" style={{ background: '#E7EAEE', width: '52%' }} />
            <span className="tc-l" style={{ background: 'rgba(231,234,238,0.18)', width: '78%' }} />
            <span className="tc-btn" style={{ background: accent }} />
          </div>
        </>
      );
    case 'transit':
      return (
        <>
          <svg className="tc-tr-track" viewBox="0 0 100 60" fill="none" aria-hidden="true">
            <path id="tc-tr-path" d="M4 50 H30 L46 32 H70 L96 10" stroke={c1} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="30" cy="50" r="3" fill={meta.bg} stroke={c1} strokeWidth="2" />
            <circle cx="70" cy="32" r="3" fill={meta.bg} stroke={c1} strokeWidth="2" />
            <circle className="tc-tr-car" r="3.4" fill={c2}>
              <animateMotion dur="3.6s" repeatCount="indefinite" path="M4 50 H30 L46 32 H70 L96 10" />
            </circle>
          </svg>
          <div className="tc-card tc-card--solid tc-tr-card">
            <span className="tc-tr-roundel" style={{ borderColor: c1 }}><span style={{ background: c1 }} /></span>
            <span className="tc-l tc-l-title" style={{ background: '#16181D', width: '50%' }} />
            <span className="tc-l" style={{ background: 'rgba(22,24,29,0.16)', width: '76%' }} />
            <span className="tc-btn" style={{ background: c1 }} />
          </div>
        </>
      );
    case 'ledger':
      return (
        <>
          <svg className="tc-le-spark" viewBox="0 0 100 40" fill="none" aria-hidden="true">
            <path className="tc-le-p" d="M3 32 L17 27 L31 30 L45 18 L59 22 L73 11 L97 6" stroke={c1} strokeWidth="1.8" strokeLinecap="round" pathLength={1} />
          </svg>
          <div className="tc-card tc-card--solid tc-le-card">
            <span className="tc-le-fig"><span className="tc-le-delta" style={{ color: c1 }}>▲</span></span>
            <span className="tc-l tc-l-title" style={{ background: '#14140F', width: '46%' }} />
            <span className="tc-l" style={{ background: 'rgba(20,20,15,0.14)', width: '74%' }} />
            <span className="tc-btn" style={{ background: c1 }} />
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
