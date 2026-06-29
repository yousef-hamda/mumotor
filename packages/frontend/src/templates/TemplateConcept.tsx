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
    case 'aurora':
      return (
        <>
          <span className="tc-blob tc-aurora-1" style={{ background: c1 }} />
          <span className="tc-blob tc-aurora-2" style={{ background: c2 }} />
          <span className="tc-blob tc-aurora-3" style={{ background: c3 }} />
          <div className="tc-card tc-card--glass-light"><Lines title="#0B1220" line="rgba(11,18,32,0.16)" btn={`linear-gradient(135deg, ${c1}, ${c3})`} /></div>
        </>
      );
    case 'obsidian':
      return (
        <>
          <div className="tc-grid" />
          <div className="tc-card tc-card--glass-dark"><Lines title="#D7E3EE" line="rgba(234,238,242,0.22)" btn={meta.accent} /></div>
        </>
      );
    case 'bento':
      return (
        <div className="tc-bento">
          <div className="tc-tile tc-tile-a" />
          <div className="tc-tile tc-tile-accent" />
          <div className="tc-tile" />
        </div>
      );
    case 'prism':
      return (
        <>
          <div className="tc-iris" />
          <div className="tc-card tc-card--glass-dark"><Lines title="#F4F5F7" line="rgba(244,245,247,0.22)" btn={`linear-gradient(110deg, ${c1}, ${c2}, ${c3})`} /></div>
        </>
      );
    case 'frosted':
      return (
        <>
          {meta.thumb && <div className="tc-photo" style={{ backgroundImage: `url(${meta.thumb})` }} />}
          <div className="tc-card tc-card--glass-dark" style={{ background: 'rgba(255,255,255,0.16)' }}><Lines title="#FFFFFF" line="rgba(255,255,255,0.42)" btn={meta.accent} /></div>
        </>
      );
    case 'night-shift':
      return (
        <>
          <span className="tc-neon-1" style={{ background: c1 }} />
          <span className="tc-neon-2" style={{ background: c2 }} />
          <div className="tc-card tc-card--glass-dark"><Lines title="#EAF2FF" line="rgba(234,242,255,0.22)" btn={meta.accent} /></div>
        </>
      );
    case 'easy-lane':
      return (
        <>
          <span className="tc-soft-1" style={{ background: c1 }} />
          <span className="tc-soft-2" style={{ background: c2 }} />
          <span className="tc-soft-3" style={{ background: c3 }} />
          <div className="tc-card tc-card--solid" style={{ borderRadius: 22 }}><Lines title={meta.ink} line="rgba(36,59,83,0.16)" btn={meta.accent} /></div>
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
    case 'prestige':
      return (
        <>
          <div className="tc-gold-frame" />
          <span className="tc-gold-line" />
        </>
      );
    case 'full-throttle':
      return (
        <>
          <span className="tc-block tc-b1" />
          <span className="tc-block tc-b2" />
          <span className="tc-block tc-b3" />
        </>
      );
    default:
      return <div className="tc-layer" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, opacity: 0.6 }} />;
  }
}
