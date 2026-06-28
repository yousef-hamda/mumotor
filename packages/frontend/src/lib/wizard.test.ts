import { describe, it, expect } from 'vitest';
import { defaultWizardConfig, sampleWizardConfig, buildBusinessHours, toBusinessConfig, SOCIAL_PLATFORMS, EXPERIENCE_LEVELS, type WizardConfig } from './wizard';

describe('wizard config', () => {
  it('sampleWizardConfig fills realistic data', () => {
    const s = sampleWizardConfig(defaultWizardConfig);
    expect(s.businessName).toBeTruthy();
    expect(s.businessDescription.length).toBeGreaterThan(20);
    expect(s.teacherName).toBeTruthy();
    expect(s.breakTimes.length).toBe(1);
    expect(s.city).toBeTruthy();
  });

  it('exposes 10 social platforms and 4 experience levels', () => {
    expect(SOCIAL_PLATFORMS.length).toBe(10);
    expect(EXPERIENCE_LEVELS.length).toBe(4);
    expect(SOCIAL_PLATFORMS).toContain('WhatsApp');
    expect(SOCIAL_PLATFORMS).toContain('TikTok');
  });

  it('buildBusinessHours — uniform shift', () => {
    const c: WizardConfig = { ...defaultWizardConfig, workingDays: ['monday', 'wednesday'], shiftStart: '08:00', shiftEnd: '18:00' };
    const h = buildBusinessHours(c);
    expect(h.monday.isOpen).toBe(true);
    expect(h.monday.open).toBe('08:00');
    expect(h.tuesday.isOpen).toBe(false);
  });

  it('buildBusinessHours — per-day overrides', () => {
    const c: WizardConfig = {
      ...defaultWizardConfig,
      customHoursPerDay: true,
      perDayHours: { ...defaultWizardConfig.perDayHours, friday: { open: '06:00', close: '10:00', closed: false } },
    };
    const h = buildBusinessHours(c);
    expect(h.friday.isOpen).toBe(true);
    expect(h.friday.open).toBe('06:00');
  });

  it('toBusinessConfig carries template + customization + branding', () => {
    const c: WizardConfig = {
      ...defaultWizardConfig,
      businessName: 'B',
      businessDescription: 'desc',
      city: 'Tel Aviv',
      address: 'St 1',
      templateChoice: 'prestige',
      logoSrc: 'data:logo',
      carPhoto: 'data:car',
      gallery: ['data:g'],
      socialLinks: { Instagram: 'ig' },
      customization: { fields: { 'hero.headline': 'H' } },
    };
    const bc = toBusinessConfig(c) as Record<string, unknown>;
    expect(bc.bio).toBe('desc');
    expect(bc.templateChoice).toBe('prestige');
    expect(bc.logoSrc).toBe('data:logo');
    expect(bc.carPhoto).toBe('data:car');
    expect(bc.gallery).toEqual(['data:g']);
    expect((bc.contact as { address: string }).address).toBe('St 1, Tel Aviv');
    expect(bc.customization).toEqual({ fields: { 'hero.headline': 'H' } });
  });
});
