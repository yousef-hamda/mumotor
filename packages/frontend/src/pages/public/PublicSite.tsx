import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { drivingSchoolApi, reviewsApi } from '../../lib/api';
import { CenteredSpinner } from '../../components/ui';
import { LogoMark } from '../../components/Logo';
import { TemplateRender } from '../../templates/TemplateRender';
import { publicToTemplateData } from '../../templates/fromWizard';
import { TEMPLATES } from '../../templates/registry';
import { useSeo } from '../../lib/seo';

/**
 * The published teacher site. Renders the design the teacher chose in the
 * builder, populated with their real data (logo, info, links, hours).
 */
export default function PublicSite() {
  const { websiteSlug = '' } = useParams();
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

  const templateData = data
    ? publicToTemplateData({
        ...(data as unknown as Parameters<typeof publicToTemplateData>[0]),
        reviews: (publicReviews ?? []).map((r, i) => ({
          id: `r${i}`,
          name: r.studentName,
          rating: r.rating,
          text: r.comment,
          meta: new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
        })),
      })
    : null;

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
            priceRange: '₪₪',
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

  return <TemplateRender slug={slug} data={templateData} />;
}
