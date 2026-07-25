import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenantSlug } from '../../lib/tenant';
import { drivingSchoolApi, reviewsApi } from '../../lib/api';
import { CenteredSpinner } from '../../components/ui';
import { LogoMark } from '../../components/Logo';
import { SiteInstallPill } from '../../components/InstallAppButton';
import { SitePausedScreen, type PausedInfo } from '../../components/public/SitePaused';
import { TemplateRender } from '../../templates/TemplateRender';
import { publicToTemplateData } from '../../templates/fromWizard';
import { TEMPLATES } from '../../templates/registry';
import { useSeo } from '../../lib/seo';
import { applyAppIdentity, resetToMumotorIdentity, siteAppIdentity } from '../../lib/pwa';
import { resolveBookTheme } from '../../lib/templateTheme';
import { bookLocale } from '../../lib/bookingStrings';
import { formatMonthYearIn } from '../../lib/utils';

/** schema.org priceRange derived from the teacher's real plans (Latin digits,
 *  ₪). Falls back to a generic indicator when no priced package exists. */
function priceRangeFromPackages(packages: { price: number }[]): string {
  const prices = packages.map((p) => p.price).filter((n) => Number.isFinite(n) && n > 0);
  if (!prices.length) return '₪₪';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const fmt = (n: number) => n.toLocaleString('en-US');
  return min === max ? `₪${fmt(min)}` : `₪${fmt(min)}–₪${fmt(max)}`;
}

/**
 * The published teacher site. Renders the design the teacher chose in the
 * builder, populated with their real data (logo, info, links, hours).
 */
export default function PublicSite() {
  const websiteSlug = useTenantSlug();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-settings', websiteSlug],
    queryFn: () => drivingSchoolApi.getPublicSettings(websiteSlug),
    retry: false,
  });

  // Approved reviews render into the template's testimonials section; the site
  // never waits on this query (reviews simply appear once loaded).
  const { data: publicReviews } = useQuery({
    queryKey: ['public-reviews', (data as { id?: string } | undefined)?.id],
    queryFn: () => reviewsApi.publicList((data as { id: string }).id),
    enabled: Boolean((data as { id?: string } | undefined)?.id),
    retry: false,
  });

  const suspended = Boolean((data as { suspended?: boolean } | undefined)?.suspended);

  const templateData = data && !suspended
    ? publicToTemplateData({
        ...(data as unknown as Parameters<typeof publicToTemplateData>[0]),
        reviews: (publicReviews ?? []).map((r, i) => ({
          id: `r${i}`,
          name: r.studentName,
          rating: r.rating,
          text: r.comment,
          reply: r.reply ?? undefined,
          meta: formatMonthYearIn(r.createdAt, String((data as { locale?: string }).locale ?? 'en')),
        })),
      })
    : null;

  // Installable PWA: on a published-site route, swap the app identity (manifest /
  // icons / title / status-bar colour) to THIS teacher's, so installing the site
  // produces their own app. Restored to Mumotor on unmount.
  const settings = data as
    | { slug?: string; name?: string; template?: string | null; logoSrc?: string | null; locale?: string | null; customization?: { theme?: Record<string, string> } }
    | undefined;
  useEffect(() => {
    if (!settings?.slug) return;
    const accent = resolveBookTheme(settings.template ?? undefined, settings.customization?.theme).vars['--book-accent'];
    applyAppIdentity(
      siteAppIdentity({ slug: settings.slug, name: settings.name ?? '', accent, logoSrc: settings.logoSrc })
    );
    return () => resetToMumotorIdentity();
  }, [settings?.slug, settings?.name, settings?.template]);

  useSeo(
    templateData
      ? {
          title: `${templateData.business.name} — ${templateData.business.tagline || 'Driving lessons'}`,
          description:
            templateData.hero.sub ||
            `Book driving lessons with ${templateData.instructor.name || templateData.business.name}. Enroll and schedule online.`,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'DrivingSchool',
            name: templateData.business.name,
            description: templateData.business.tagline || undefined,
            url: `${window.location.origin}/p/${websiteSlug}`,
            telephone: templateData.contact.phone || undefined,
            email: templateData.contact.email || undefined,
            address: templateData.contact.address || undefined,
            image: templateData.hero.image || undefined,
            priceRange: priceRangeFromPackages(templateData.packages),
            areaServed: templateData.areas.length ? templateData.areas.map((a) => a.name) : undefined,
          },
        }
      : {}
  );

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <CenteredSpinner label="Loading…" />
      </div>
    );

  // Frozen site (owner's free month lapsed) → on-brand "paused" screen.
  if (suspended) return <SitePausedScreen settings={(settings ?? {}) as PausedInfo} />;

  if (isError || !data || !templateData)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-4 text-center">
        <Link
          to="/"
          aria-label="Mumotor home"
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sand-200 bg-sand-50 transition-opacity hover:opacity-80"
        >
          <LogoMark size="sm" />
        </Link>
        <h1 className="text-xl font-semibold text-sand-900">School not found</h1>
        <p className="text-sm text-sand-600">This page may be incorrect or no longer published.</p>
        <Link to="/" className="btn-secondary mt-4">Back to Mumotor</Link>
      </div>
    );

  const slug = data.template && TEMPLATES.some((t) => t.slug === data.template) ? data.template : TEMPLATES[0].slug;

  return (
    <>
      <TemplateRender slug={slug} data={templateData} />
      <SiteInstallPill slug={websiteSlug} locale={bookLocale(settings?.locale ?? undefined)} />
    </>
  );
}
