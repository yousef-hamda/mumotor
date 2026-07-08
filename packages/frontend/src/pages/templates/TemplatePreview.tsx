import { Suspense, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, LayoutGrid, Check } from 'lucide-react';
import { TEMPLATES, getTemplate, getTemplateIndex } from '../../templates/registry';
import { TemplateRender } from '../../templates/TemplateRender';
import { applyOverrides } from '../../templates/customize/overrides';
import { sampleData } from '../../templates/sampleData';

export default function TemplatePreview() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const accent = params.get('accent') || undefined;
  const meta = getTemplate(slug);
  const idx = getTemplateIndex(slug);

  const prev = idx > 0 ? TEMPLATES[idx - 1] : TEMPLATES[TEMPLATES.length - 1];
  const next = idx < TEMPLATES.length - 1 ? TEMPLATES[idx + 1] : TEMPLATES[0];

  // Reset scroll when switching template; keyboard arrows switch templates.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // In RTL, the left arrow visually means "next" and the right arrow "previous".
      const rtl = document.documentElement.dir === 'rtl';
      if (e.key === 'ArrowLeft') navigate(`/templates/${(rtl ? next : prev).slug}`);
      if (e.key === 'ArrowRight') navigate(`/templates/${(rtl ? prev : next).slug}`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, prev.slug, next.slug]);

  if (!meta) {
    return (
      <div className="grid min-h-dvh place-items-center bg-white text-sand-900">
        <div className="text-center">
          <p className="text-lg font-semibold">{t('templates.preview.notFound')}</p>
          <Link to="/templates" className="btn btn-primary mt-4">
            {t('templates.preview.backToGallery')}
          </Link>
        </div>
      </div>
    );
  }

  const Component = meta.Component;
  // For the mumotor template, an `?accent` query recolours the live preview's main colour.
  const themedData = accent ? applyOverrides(sampleData, { theme: { '--mm-accent': accent } }) : null;

  return (
    <div className="relative min-h-dvh bg-white">
      {/* The live, scrollable, interactive template */}
      <Suspense fallback={<PreviewLoader />}>
        {themedData ? <TemplateRender slug={meta.slug} data={themedData} /> : <Component />}
      </Suspense>

      {/* Floating chrome — switch between templates / use this one */}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex justify-center px-4">
        <div className="pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-1 rounded-full border border-white/15 bg-black/80 p-1.5 text-white shadow-elevated backdrop-blur-xl">
          <Link
            to="/templates"
            title={t('templates.preview.allTemplates')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white coarse:h-11 coarse:w-11"
          >
            <LayoutGrid className="h-4 w-4" />
          </Link>
          <span className="mx-1 h-5 w-px shrink-0 bg-white/15" />
          <Link
            to={`/templates/${prev.slug}`}
            title={t('templates.preview.prevTitle', { name: prev.name })}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white coarse:h-11 coarse:w-11"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <div className="min-w-0 select-none px-2 text-center">
            <div className="truncate text-[11px] font-semibold leading-tight">{meta.name}</div>
            <div className="truncate text-[10px] leading-tight text-white/50">
              {idx + 1} / {TEMPLATES.length} · {t(`templates.designs.${meta.slug}.style`, meta.style)}
            </div>
          </div>
          <Link
            to={`/templates/${next.slug}`}
            title={t('templates.preview.nextTitle', { name: next.name })}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white coarse:h-11 coarse:w-11"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <span className="mx-1 h-5 w-px shrink-0 bg-white/15" />
          <Link
            to={`/builder?template=${meta.slug}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Check className="h-3.5 w-3.5" />
            {t('templates.preview.useThis')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function PreviewLoader() {
  return (
    <div className="grid min-h-dvh place-items-center bg-sand-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-sand-300 border-t-sand-900" />
    </div>
  );
}
