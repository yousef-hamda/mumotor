import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { websiteApi } from '../../lib/api';
import { CenteredSpinner } from '../../components/ui';
import CustomizeMode from '../../components/customize/CustomizeMode';
import { publicToTemplateData, syncPackageOverrideToPlans, reconcilePackageOverride, type PublicSiteData } from '../../templates/fromWizard';
import { TEMPLATES } from '../../templates/registry';
import type { PlanInput } from '../../lib/wizard';
import type { Customization } from '../../templates/customize/overrides';

/** Dashboard live editor for an existing website (post-publish). */
export default function CustomizePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: website, isLoading } = useQuery({ queryKey: ['website', id], queryFn: () => websiteApi.get(id) });
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const built = useMemo(() => {
    if (!website) return null;
    const cfg = (website.configuration ?? {}) as Record<string, unknown>;
    const input: PublicSiteData = {
      name: website.name,
      tagline: (website.tagline ?? (cfg.tagline as string)) || '',
      teacherName: (cfg.teacherName as string) || '',
      bio: (cfg.bio as string) || '',
      pricePerClass: (cfg.pricePerClass as number) ?? null,
      experienceLevel: (cfg.experienceLevel as string) || '5-10',
      classDuration: (cfg.classDuration as number) ?? 45,
      transmission: (cfg.transmission as string) || null,
      plans: (cfg.plans as PlanInput[]) || null,
      locale: website.locale,
      template: website.selectedPreset ?? (cfg.templateChoice as string) ?? null,
      logoSrc: (cfg.logoSrc as string) || null,
      carPhoto: (cfg.carPhoto as string) || null,
      instructorPhoto: (cfg.instructorPhoto as string) || null,
      gallery: (cfg.gallery as string[]) || null,
      city: (cfg.city as string) || null,
      businessHours: website.settings?.businessHours ?? null,
      contact: (cfg.contact as PublicSiteData['contact']) ?? null,
      socialLinks: (cfg.socialLinks as Record<string, string>) ?? null,
    };
    const slug = input.template && TEMPLATES.some((t) => t.slug === input.template) ? input.template : TEMPLATES[0].slug;
    const baseData = publicToTemplateData(input);
    // Drop a stale packages override that structurally desyncs from the plans so the
    // editor shows the same cards the live site does (and Save can't launder it into
    // plans). Matches the live render path in buildTemplateData.
    const value = reconcilePackageOverride((cfg.customization as Customization) ?? undefined, baseData.packages.length) ?? undefined;
    return { baseData, slug, value, plans: input.plans ?? undefined };
  }, [website]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  if (isLoading || !built) {
    return <div className="grid min-h-screen place-items-center bg-sand-50"><CenteredSpinner label="Loading editor…" /></div>;
  }

  const save = async (c: Customization) => {
    try {
      // Fold Customize package edits into `plans` so the two never diverge; persist both.
      const { plans, customization } = syncPackageOverrideToPlans(c, built?.plans);
      const configuration: Record<string, unknown> = { customization };
      if (plans) configuration.plans = plans;
      const updated = await websiteApi.update(id, { configuration });
      // Refresh the cache with the server truth so re-opening the editor doesn't render
      // a stale pre-save snapshot and overwrite this save on the next edit (H1). Also
      // refresh the dashboard site list.
      queryClient.setQueryData(['website', id], updated);
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      // Bottom-center so it never covers the top-right Save/Done buttons.
      toast.success('Saved', { position: 'bottom-center' });
    } catch (e) {
      toast.error("Couldn't save changes", { position: 'bottom-center' });
      throw e; // rethrow so the editor keeps the state dirty instead of marking it saved (H7)
    }
  };

  return (
    <CustomizeMode
      baseData={built.baseData}
      templateSlug={built.slug}
      value={built.value}
      websiteId={id}
      onSave={save}
      onDone={() => navigate('/dashboard')}
    />
  );
}
