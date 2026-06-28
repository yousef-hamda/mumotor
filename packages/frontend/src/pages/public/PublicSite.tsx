import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { drivingSchoolApi } from '../../lib/api';
import { CenteredSpinner } from '../../components/ui';
import { LogoMark } from '../../components/Logo';
import { TemplateRender } from '../../templates/TemplateRender';
import { publicToTemplateData } from '../../templates/fromWizard';
import { TEMPLATES } from '../../templates/registry';

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

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <CenteredSpinner label="Loading…" />
      </div>
    );

  if (isError || !data)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sand-200 bg-sand-50">
          <LogoMark size="sm" />
        </div>
        <h1 className="text-xl font-semibold text-sand-900">School not found</h1>
        <p className="text-sm text-sand-600">This page may be incorrect or no longer published.</p>
        <Link to="/" className="btn-secondary mt-4">Back to Mumotor</Link>
      </div>
    );

  const templateData = publicToTemplateData(data as unknown as Parameters<typeof publicToTemplateData>[0]);
  const slug = data.template && TEMPLATES.some((t) => t.slug === data.template) ? data.template : TEMPLATES[0].slug;

  return <TemplateRender slug={slug} data={templateData} />;
}
