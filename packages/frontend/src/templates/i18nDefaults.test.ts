import { describe, it, expect } from 'vitest';
import { pruneForeignLocaleLabels } from './i18nDefaults';
import { T } from './strings';
import type { Customization } from './customize/overrides';

describe('pruneForeignLocaleLabels', () => {
  it('returns the SAME reference when nothing is foreign (no-op)', () => {
    const cz: Customization = {
      fields: {
        'hero.headline': 'My custom headline',
        'labels.bookCta': T.en.bookCta, // same-language default → valid
        stats: [{ value: '10+', label: 'Happy drivers' }],
      },
    };
    expect(pruneForeignLocaleLabels(cz, 'en')).toBe(cz);
    expect(pruneForeignLocaleLabels(undefined, 'en')).toBeUndefined();
    expect(pruneForeignLocaleLabels(null, 'he')).toBeNull();
  });

  it('prunes a stats array PER ITEM — the foreign-default item goes, custom items stay', () => {
    const cz: Customization = {
      fields: {
        stats: [
          { value: '15', label: T.ar.statYears },        // Arabic default on an EN site → drop
          { value: '500', label: 'Students since 2010' }, // genuine custom → keep
        ],
      },
    };
    const out = pruneForeignLocaleLabels(cz, 'en');
    expect(out).not.toBe(cz);
    expect(out?.fields?.stats).toEqual([{ value: '500', label: 'Students since 2010' }]);
    // input never mutated
    expect((cz.fields?.stats as unknown[]).length).toBe(2);
  });

  it('drops the whole array override when EVERY item is foreign (falls back to defaults)', () => {
    const cz: Customization = {
      fields: {
        stats: [
          { value: '15', label: T.ar.statYears },
          { value: '60', label: T.he.statMinutes },
        ],
        'hero.headline': 'Keep me',
      },
    };
    const out = pruneForeignLocaleLabels(cz, 'en');
    expect(out?.fields?.stats).toBeUndefined();
    expect(out?.fields?.['hero.headline']).toBe('Keep me');
  });

  it('drops a packages array WHOLE when any item is foreign (must stay in lockstep with plans)', () => {
    const cz: Customization = {
      fields: {
        packages: [
          { name: 'My custom block', price: 1100, features: ['Ten lessons'] },
          { name: 'Single lesson', price: 120, features: [T.he.bookCta] }, // one foreign string
        ],
      },
    };
    const out = pruneForeignLocaleLabels(cz, 'en');
    expect(out).not.toBe(cz);
    expect(out?.fields?.packages).toBeUndefined();
  });

  it('never prunes genuine custom text (labels, copy, or list items)', () => {
    const cz: Customization = {
      fields: {
        'labels.bookCta': 'Grab your seat!',
        'copy.bookHeading': 'שיעור ראשון עליי', // custom Hebrew on an EN site — not a default → keep
        areas: [{ name: 'Netanya', note: 'Home base' }],
      },
    };
    expect(pruneForeignLocaleLabels(cz, 'en')).toBe(cz);
  });

  it('drops a foreign-locale labels.* string override (existing behaviour preserved)', () => {
    const cz: Customization = { fields: { 'labels.bookCta': T.ar.bookCta, 'labels.callCta': 'Ring me' } };
    const out = pruneForeignLocaleLabels(cz, 'en');
    expect(out?.fields?.['labels.bookCta']).toBeUndefined();
    expect(out?.fields?.['labels.callCta']).toBe('Ring me');
  });
});
