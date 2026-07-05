import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { websiteApi } from '../../lib/api';
import { CenteredSpinner } from '../../components/ui';
import CustomizeMode from '../../components/customize/CustomizeMode';
import { publicToTemplateData, type PublicSiteData } from '../../templates/fromWizard';
import { TEMPLATES } from '../../templates/registry';
import type { Customization } from '../../templates/customize/overrides';

/** Dashboard live editor for an existing website (post-publish). */
export default function CustomizePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
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
      locale: website.locale,
      template: website.selectedPreset ?? (cfg.templateChoice as string) ?? null,
      logoSrc: (cfg.logoSrc as string) || null,
      carPhoto: (cfg.carPhoto as string) || null,
      gallery: (cfg.gallery as string[]) || null,
      city: (cfg.city as string) || null,
      businessHours: website.settings?.businessHours ?? null,
      contact: (cfg.contact as PublicSiteData['contact']) ?? null,
      socialLinks: (cfg.socialLinks as Record<string, string>) ?? null,
    };
    const slug = input.template && TEMPLATES.some((t) => t.slug === input.template) ? input.template : TEMPLATES[0].slug;
    return { baseData: publicToTemplateData(input), slug, value: (cfg.customization as Customization) ?? undefined };
  }, [website]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  if (isLoading || !built) {
    return <div className="grid min-h-screen place-items-center bg-sand-50"><CenteredSpinner label="Loading editor…" /></div>;
  }

  const save = async (c: Customization) => {
    try {
      await websiteApi.update(id, { configuration: { customization: c } as Record<string, unknown> });
      // Bottom-center so it never covers the top-right Save/Done buttons.
      toast.success('Saved', { position: 'bottom-center' });
    } catch {
      toast.error("Couldn't save changes", { position: 'bottom-center' });
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
