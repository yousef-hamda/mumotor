import { describe, it, expect } from 'vitest';
import { wizardToTemplateData, publicToTemplateData, type PublicSiteData } from './fromWizard';
import { defaultWizardConfig, type WizardConfig } from '../lib/wizard';

function cfg(over: Partial<WizardConfig> = {}): WizardConfig {
  return { ...defaultWizardConfig, ...over };
}

describe('wizardToTemplateData', () => {
  it('maps the owner-entered data (no invention)', () => {
    const d = wizardToTemplateData(cfg({
      businessName: 'Acme Driving',
      teacherName: 'Dana',
      businessDescription: 'Calm patient lessons.',
      tagline: 'Drive easy.',
      city: 'Haifa',
      address: '5 Herzl St',
      pricePerClass: 90,
      classDuration: 60,
      experienceLevel: '10+',
      phone: '050-1',
      email: 'a@b.c',
      carPhoto: 'data:car',
      gallery: ['data:g1', 'data:g2'],
      socialLinks: { Instagram: 'https://ig/x', WhatsApp: 'https://wa/x' },
    }));
    expect(d.business.name).toBe('Acme Driving');
    expect(d.business.tagline).toBe('Drive easy.');
    expect(d.instructor.name).toBe('Dana');
    expect(d.instructor.bio).toBe('Calm patient lessons.');
    expect(d.hero.eyebrow).toContain('Haifa');
    expect(d.hero.image).toBe('data:car');     // car photo → hero image
    expect(d.gallery).toEqual(['data:g1', 'data:g2']);
    expect(d.contact.instagram).toBe('https://ig/x');
    expect(d.contact.socials?.some((s) => s.platform === 'instagram' && s.url === 'https://ig/x')).toBe(true);
    expect(d.contact.address).toBe('5 Herzl St, Haifa');
    expect(d.reviews).toEqual([]);             // no fabricated testimonials
    expect(d.stats.length).toBeGreaterThan(0); // honest stats from real data
  });

  it('builds hours from working days (uniform shift)', () => {
    const d = wizardToTemplateData(cfg({ workingDays: ['monday'], shiftStart: '09:00', shiftEnd: '17:00' }));
    const mon = d.hours.find((h) => h.day === 'Monday');
    const sun = d.hours.find((h) => h.day === 'Sunday');
    expect(mon?.closed).toBe(false);
    expect(mon?.open).toBe('09:00');
    expect(sun?.closed).toBe(true);
  });

  it('respects per-day custom hours', () => {
    const d = wizardToTemplateData(cfg({
      customHoursPerDay: true,
      perDayHours: { ...defaultWizardConfig.perDayHours, tuesday: { open: '07:00', close: '12:00', closed: false } },
    }));
    const tue = d.hours.find((h) => h.day === 'Tuesday');
    expect(tue?.open).toBe('07:00');
    expect(tue?.closed).toBe(false);
  });

  it('uses the teacher plans → packages (no invented Test Ready/Intensive)', () => {
    const d = wizardToTemplateData(cfg({
      pricePerClass: 120,
      plans: [
        { id: 'single', name: 'Single lesson', price: 120, unit: '/ lesson', features: ['Automatic transmission'] },
        { id: 'b10', name: '10-lesson block', price: 1100, unit: '10 lessons', popular: true, features: ['Save vs single'] },
      ],
    }));
    expect(d.packages).toHaveLength(2);
    expect(d.packages.map((p) => p.name)).toEqual(['Single lesson', '10-lesson block']);
    expect(d.packages[1].popular).toBe(true);
    expect(d.packages.find((p) => p.name === 'Test Ready')).toBeUndefined();
  });

  it('tailors the FAQ to the transmission choice + WhatsApp uses the phone', () => {
    const man = wizardToTemplateData(cfg({ transmission: 'manual', phone: '050-111-2222' }));
    expect(man.faqs[0].q).toMatch(/manual or automatic/i);
    expect(man.faqs[0].a).toMatch(/manual/i);
    // WhatsApp must be a wa.me-valid INTERNATIONAL number: Israeli local 050…
    // → 972 50… (leading 0 dropped). This is the #2 fix that makes the link open.
    expect(man.contact.whatsapp).toBe('972501112222');
    const auto = wizardToTemplateData(cfg({ transmission: 'automatic' }));
    expect(auto.faqs[0].a).toMatch(/automatic/i);
  });

  it('uses the uploaded instructor photo', () => {
    const d = wizardToTemplateData(cfg({ instructorPhoto: 'data:me' }));
    expect(d.instructor.photo).toBe('data:me');
  });

  it('applies customization overrides on top of real data', () => {
    const d = wizardToTemplateData(cfg({
      businessName: 'X',
      customization: { fields: { 'hero.headline': 'OVERRIDDEN', 'labels.bookCta': 'Reserve' }, theme: { '--red': '#123456' } },
    }));
    expect(d.hero.headline).toBe('OVERRIDDEN');
    expect(d.labels?.bookCta).toBe('Reserve');
    expect(d.theme?.['--red']).toBe('#123456');
  });
});

describe('publicToTemplateData', () => {
  it('maps published settings + customization', () => {
    const input: PublicSiteData = {
      name: 'Pub School',
      slug: 'pub-school',
      transmission: 'manual',
      plans: [{ id: 'x', name: 'One lesson', price: 90, unit: '/ lesson', features: ['a'] }],
      instructorPhoto: 'data:me',
      tagline: 'Go far.',
      teacherName: 'Sam',
      bio: 'Friendly lessons.',
      pricePerClass: 80,
      experienceLevel: '5-10',
      classDuration: 45,
      locale: 'EN',
      template: 'night-shift',
      carPhoto: 'data:car',
      gallery: ['data:g'],
      city: 'Eilat',
      contact: { phone: '050', email: 'e', address: 'Eilat' },
      socialLinks: { Facebook: 'https://fb/x' },
      customization: { theme: { '--ns-cyan': '#00FF88' }, fields: { 'hero.headline': 'HELLO' } },
    };
    const d = publicToTemplateData(input);
    expect(d.business.name).toBe('Pub School');
    expect(d.instructor.bio).toBe('Friendly lessons.');
    expect(d.hero.eyebrow).toContain('Eilat');
    expect(d.hero.headline).toBe('HELLO');           // customization applied
    expect(d.theme?.['--ns-cyan']).toBe('#00FF88');
    expect(d.contact.facebook).toBe('https://fb/x');
    expect(d.bookingUrl).toBe('/p/pub-school/book-lesson');
    expect(d.enrollUrl).toBe('/p/pub-school/enroll');
    expect(d.packages).toHaveLength(1);
    expect(d.instructor.photo).toBe('data:me');
  });
});
