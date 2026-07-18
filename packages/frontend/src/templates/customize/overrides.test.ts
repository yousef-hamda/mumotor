import { describe, it, expect } from 'vitest';
import { applyOverrides, getPath, setPath, isCustomized, colorSlotsFor, COLOR_SLOTS, EDIT_SECTIONS, fieldLabelFor, stylesToCss, parseListPath } from './overrides';
import { sampleData } from '../sampleData';

describe('overrides: styles (per-element colour) + list paths', () => {
  it('applies styles and stylesToCss emits scoped rules', () => {
    const out = applyOverrides(sampleData, { styles: { 'hero.headline': { color: '#ff0000' } } });
    expect(out.styles?.['hero.headline']?.color).toBe('#ff0000');
    const css = stylesToCss(out.styles);
    expect(css).toContain('[data-edit="hero.headline"]');
    expect(css).toContain('color:#ff0000');
  });
  it('parseListPath recognises list-item paths', () => {
    expect(parseListPath('packages.0.name')).toEqual({ array: 'packages', index: 0, field: 'name' });
    expect(parseListPath('faqs.2.q')).toEqual({ array: 'faqs', index: 2, field: 'q' });
    expect(parseListPath('hero.headline')).toBeNull();
  });
});

describe('overrides: get/setPath', () => {
  it('reads nested + array paths', () => {
    expect(getPath(sampleData, 'business.name')).toBe(sampleData.business.name);
    expect(getPath(sampleData, 'hero.headline')).toBe(sampleData.hero.headline);
    expect(getPath(sampleData, 'about.body.0')).toBe(sampleData.about.body[0]);
    expect(getPath(sampleData, 'nope.missing')).toBeUndefined();
  });

  it('sets a nested path immutably-ish on a clone', () => {
    const clone = JSON.parse(JSON.stringify(sampleData));
    setPath(clone, 'hero.headline', 'NEW');
    expect(clone.hero.headline).toBe('NEW');
    setPath(clone, 'labels.bookCta', 'Reserve');
    expect(clone.labels.bookCta).toBe('Reserve');
  });
});

describe('overrides: applyOverrides', () => {
  it('returns base unchanged when no customization', () => {
    expect(applyOverrides(sampleData, undefined)).toBe(sampleData);
    expect(applyOverrides(sampleData, {})).toBe(sampleData);
  });

  it('applies field overrides without mutating the base', () => {
    const out = applyOverrides(sampleData, { fields: { 'hero.headline': 'CHANGED', 'labels.bookCta': 'Reserve' } });
    expect(out.hero.headline).toBe('CHANGED');
    expect(out.labels?.bookCta).toBe('Reserve');
    expect(sampleData.hero.headline).not.toBe('CHANGED'); // base untouched
  });

  it('merges theme overrides', () => {
    const out = applyOverrides(sampleData, { theme: { '--red': '#00FF00' } });
    expect(out.theme?.['--red']).toBe('#00FF00');
  });

  it('replaces whole arrays (stats/packages/areas/faqs editing)', () => {
    const out = applyOverrides(sampleData, {
      fields: {
        stats: [{ label: 'Custom stat', value: 5, suffix: '+' }],
        packages: [{ id: 'x', name: 'Solo', price: 50, features: ['a', 'b'] }],
        faqs: [{ q: 'Q?', a: 'A.' }],
        areas: [{ name: 'Downtown' }],
      },
    });
    expect(out.stats).toHaveLength(1);
    expect(out.stats[0].label).toBe('Custom stat');
    expect(out.packages[0].name).toBe('Solo');
    expect(out.faqs[0].q).toBe('Q?');
    expect(out.areas[0].name).toBe('Downtown');
    expect(sampleData.stats.length).toBeGreaterThan(1); // base untouched
  });

  it('isCustomized reflects presence of edits', () => {
    expect(isCustomized(undefined)).toBe(false);
    expect(isCustomized({})).toBe(false);
    expect(isCustomized({ fields: { a: 1 } })).toBe(true);
    expect(isCustomized({ theme: { '--x': '#000' } })).toBe(true);
  });
});

describe('overrides: colour slots + sections', () => {
  it('exposes colour slots for every template', () => {
    const slugs = [
      'mumotor', 'meridian', 'bezel', 'solari', 'cadence', 'circuit', 'press',
      'reel', 'slate', 'primary', 'gallery', 'gilt', 'sumi',
      'console', 'transit', 'ledger',
      'grid-ink', 'open-road',
    ];
    for (const slug of slugs) {
      const slots = colorSlotsFor(slug);
      expect(slots.length).toBeGreaterThan(0);
      for (const s of slots) {
        expect(s.cssVar.startsWith('--')).toBe(true);
        expect(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s.default)).toBe(true);
      }
    }
    // every registered template has a colour-slot entry
    expect(Object.keys(COLOR_SLOTS)).toEqual(expect.arrayContaining(slugs));
  });

  it('edit sections cover core fields', () => {
    const paths = EDIT_SECTIONS.flatMap((s) => s.fields.map((f) => f.path));
    expect(paths).toContain('hero.headline');
    expect(paths).toContain('business.logoSrc');
    expect(paths).toContain('labels.bookCta');
    expect(fieldLabelFor('hero.headline')).toBe('Headline');
  });
});
