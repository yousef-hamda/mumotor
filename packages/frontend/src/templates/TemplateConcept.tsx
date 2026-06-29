/**
 * TemplateConcept — a small, bespoke ANIMATED preview that expresses each
 * template's actual aesthetic (palette + glass style + motion signature), used
 * on the gallery + builder cards instead of an unrelated driving photo.
 * Pure CSS (cheap, reduced-motion safe). Fills its (relatively-positioned) parent.
 */
import type { CSSProperties } from 'react';
import type { TemplateMeta } from './registry';
import './TemplateConcept.css';

type Vars = CSSProperties & Record<string, string>;

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
          <div className="tc-glass">
            <span className="tc-glass-bar" style={{ left: '12%', top: '28%', width: '55%' }} />
            <span className="tc-glass-bar" style={{ left: '12%', top: '52%', width: '38%', opacity: 0.7 }} />
          </div>
        </>
      );
    case 'obsidian':
      return (
        <>
          <div className="tc-grid" />
          <div className="tc-panel" />
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
          <div className="tc-flow-glass" />
        </>
      );
    case 'prism':
      return (
        <>
          <div className="tc-iris-panel" />
          <div className="tc-iris" />
        </>
      );
    case 'frosted':
      return (
        <>
          {meta.thumb && <div className="tc-photo" style={{ backgroundImage: `url(${meta.thumb})` }} />}
          <div className="tc-frost" />
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
    case 'night-shift':
      return (
        <>
          <span className="tc-blob tc-neon-1" style={{ background: c1 }} />
          <span className="tc-blob tc-neon-2" style={{ background: c2 }} />
          <div className="tc-neon-panel" />
        </>
      );
    case 'easy-lane':
      return (
        <>
          <span className="tc-soft-1" style={{ background: c1 }} />
          <span className="tc-soft-2" style={{ background: c2 }} />
          <span className="tc-pill" />
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
