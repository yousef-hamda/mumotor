import { describe, it, expect } from 'vitest';
import { SocialIcon } from './SocialIcon';

describe('SocialIcon', () => {
  it('returns an svg brand mark for known platforms', () => {
    for (const p of ['facebook', 'instagram', 'whatsapp', 'tiktok', 'x', 'linkedin']) {
      const el = SocialIcon({ platform: p }) as { type: string; props: { children: unknown } };
      expect(el.type).toBe('svg');
    }
  });
  it('falls back to a globe svg for unknown platforms', () => {
    const el = SocialIcon({ platform: 'myspace' }) as { type: string };
    expect(el.type).toBe('svg');
  });
});
