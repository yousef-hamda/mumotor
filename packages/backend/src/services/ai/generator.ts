import { buildSiteHtml, type BuildOpts, type GeneratedSiteConfig } from './templateBuilder.js';

/**
 * Orchestrates website generation. Today it's a fast, deterministic build from
 * a preset + the teacher's config. (Hook point for an optional AI "Stage 1"
 * bio-enhancement call when an AI provider key is configured.)
 */
export function generateWebsite(opts: BuildOpts): { html: string; metadata: Record<string, unknown> } {
  const result = buildSiteHtml(opts);
  result.metadata.generatedAt = new Date().toISOString();
  return result;
}

/** Map a stored Website.configuration blob into the generator's config shape. */
export function configToSiteConfig(configuration: Record<string, unknown>): GeneratedSiteConfig {
  const c = configuration ?? {};
  return {
    teacherName: c.teacherName as string | undefined,
    tagline: c.tagline as string | undefined,
    bio: c.bio as string | undefined,
    pricePerClass: c.pricePerClass as string | number | undefined,
    classDuration: c.classDuration as number | undefined,
    passRate: c.passRate as number | undefined,
    experienceYears: c.experienceYears as string | number | undefined,
    studentsTaught: c.studentsTaught as string | number | undefined,
    rating: c.rating as string | number | undefined,
    shiftStart: c.shiftStart as string | undefined,
    shiftEnd: c.shiftEnd as string | undefined,
    breakTimes: c.breakTimes as { start: string; end: string }[] | undefined,
    lessonTypes: c.lessonTypes as GeneratedSiteConfig['lessonTypes'],
    faqs: c.faqs as GeneratedSiteConfig['faqs'],
    testimonials: c.testimonials as GeneratedSiteConfig['testimonials'],
    galleryPhotos: c.galleryPhotos as string[] | undefined,
    carPhoto: c.carPhoto as GeneratedSiteConfig['carPhoto'],
    heroPhoto: c.heroPhoto as string | undefined,
    socialLinks: c.socialLinks as Record<string, string> | undefined,
    contact: c.contact as GeneratedSiteConfig['contact'],
    enabledSections: c.enabledSections as string[] | undefined,
    locale: c.locale as GeneratedSiteConfig['locale'],
    colors: c.colors as GeneratedSiteConfig['colors'],
  };
}
