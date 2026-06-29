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

export function TemplateConcept({ meta }: { meta: TemplateMeta }) {
  const [c1, c2, c3] = [meta.swatch[1] ?? meta.accent, meta.swatch[2] ?? meta.accent, meta.swatch[3] ?? meta.accent];
  const vars: Vars = {
    background: meta.bg,
    '--tc-accent': meta.accent,
    '--tc-ink': meta.ink,
    '--tc-c1': c1,
    '--tc-c2': c2,
    '--tc-c3': c3,
  };
  return (
    <div className="tc-root" style={vars} aria-hidden="true">
      {render(meta, c1, c2, c3)}
    </div>
  );
}

function render(meta: TemplateMeta, c1: string, c2: string, c3: string) {
  switch (meta.slug) {
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
    case 'flow':
      return (
        <>
          <div className="tc-flow" />
          <div className="tc-card tc-card--glass-dark"><Lines title="#FFFFFF" line="rgba(255,255,255,0.30)" btn={`linear-gradient(135deg, ${c1}, ${c2})`} /></div>
        </>
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
